"""
GitHub Agent Tester - Automatically tests all agents and creates GitHub issues for failures
"""
import os
import json
import yaml
import asyncio
import aiohttp
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from retriever_utils import load_agent_config, load_baseline_questions


@dataclass
class TestResult:
    agent_type: str
    question_id: str
    question: str
    expected_answer: str
    actual_answer: str
    passed: bool
    confidence_score: float
    execution_time: float
    error_message: Optional[str] = None


@dataclass
class AgentTestSummary:
    agent_type: str
    total_questions: int
    passed: int
    failed: int
    average_confidence: float
    total_execution_time: float
    test_timestamp: str
    results: List[TestResult]


class GitHubTesterAgent:
    """
    Agent that tests other agents and creates GitHub issues for failures
    """
    
    def __init__(self, github_token: str = None):
        self.github_token = github_token or os.getenv('GITHUB_PAT')
        self.github_org = "F8ai"
        self.base_url = "https://api.github.com"
        self.agents_directory = "../"
        
        # Discover available agents
        self.discovered_agents = self._discover_agents()
        
    def _discover_agents(self) -> List[str]:
        """Discover all agent directories"""
        agents = []
        base_path = self.agents_directory
        
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            if os.path.isdir(item_path) and item.endswith('-agent'):
                config_path = os.path.join(item_path, 'agent_config.yaml')
                baseline_path = os.path.join(item_path, 'baseline.json')
                
                if os.path.exists(config_path) and os.path.exists(baseline_path):
                    agents.append(item)
        
        return agents
    
    async def test_single_agent(self, agent_name: str) -> AgentTestSummary:
        """Test a single agent with its baseline questions"""
        agent_path = os.path.join(self.agents_directory, agent_name)
        
        try:
            # Load agent configuration and baseline questions
            config = load_agent_config(agent_path)
            baseline = load_baseline_questions(agent_path)
            
            agent_type = config['agent']['type']
            questions = baseline['questions']
            
            print(f"Testing {agent_type} agent with {len(questions)} questions...")
            
            test_results = []
            total_execution_time = 0
            
            for question in questions:
                result = await self._test_agent_question(agent_path, question)
                test_results.append(result)
                total_execution_time += result.execution_time
            
            # Calculate summary statistics
            passed = sum(1 for r in test_results if r.passed)
            failed = len(test_results) - passed
            avg_confidence = sum(r.confidence_score for r in test_results) / len(test_results) if test_results else 0
            
            summary = AgentTestSummary(
                agent_type=agent_type,
                total_questions=len(questions),
                passed=passed,
                failed=failed,
                average_confidence=avg_confidence,
                total_execution_time=total_execution_time,
                test_timestamp=datetime.now().isoformat(),
                results=test_results
            )
            
            print(f"✅ {agent_type} test completed: {passed}/{len(questions)} passed")
            return summary
            
        except Exception as e:
            print(f"❌ Error testing {agent_name}: {str(e)}")
            return AgentTestSummary(
                agent_type=agent_name,
                total_questions=0,
                passed=0,
                failed=1,
                average_confidence=0,
                total_execution_time=0,
                test_timestamp=datetime.now().isoformat(),
                results=[TestResult(
                    agent_type=agent_name,
                    question_id="error",
                    question="Agent initialization",
                    expected_answer="Successful initialization",
                    actual_answer="",
                    passed=False,
                    confidence_score=0,
                    execution_time=0,
                    error_message=str(e)
                )]
            )
    
    async def _test_agent_question(self, agent_path: str, question: Dict) -> TestResult:
        """Test a single question against an agent"""
        start_time = datetime.now()
        
        try:
            # Import and run the agent
            agent_module_path = os.path.join(agent_path, 'agent.py')
            
            # Run agent as subprocess to isolate it
            result = await self._run_agent_subprocess(agent_path, question['question'])
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Evaluate the response
            evaluation = await self._evaluate_response(
                question['question'],
                question['expectedAnswer'],
                result.get('response', ''),
                question.get('tags', [])
            )
            
            return TestResult(
                agent_type=result.get('agent_type', 'unknown'),
                question_id=question['id'],
                question=question['question'],
                expected_answer=question['expectedAnswer'],
                actual_answer=result.get('response', ''),
                passed=evaluation['passed'],
                confidence_score=evaluation['confidence'],
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return TestResult(
                agent_type="unknown",
                question_id=question['id'],
                question=question['question'],
                expected_answer=question['expectedAnswer'],
                actual_answer="",
                passed=False,
                confidence_score=0,
                execution_time=execution_time,
                error_message=str(e)
            )
    
    async def _run_agent_subprocess(self, agent_path: str, query: str) -> Dict:
        """Run agent as subprocess"""
        try:
            # Run the agent CLI
            cmd = [
                'python', 'agent.py',
                '--query', query,
                '--user-id', 'github_tester',
                '--agent-path', '.'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=agent_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Parse the response (simplified)
                output = stdout.decode()
                if "Response:" in output:
                    response = output.split("Response:")[-1].strip()
                    return {
                        'response': response,
                        'agent_type': os.path.basename(agent_path).replace('-agent', ''),
                        'success': True
                    }
            
            return {
                'response': f"Error: {stderr.decode()}",
                'agent_type': os.path.basename(agent_path).replace('-agent', ''),
                'success': False
            }
            
        except Exception as e:
            return {
                'response': f"Subprocess error: {str(e)}",
                'agent_type': 'unknown',
                'success': False
            }
    
    async def _evaluate_response(self, question: str, expected: str, actual: str, tags: List[str]) -> Dict:
        """Evaluate response quality using simple heuristics"""
        # Simple keyword-based evaluation
        expected_keywords = set(expected.lower().split())
        actual_keywords = set(actual.lower().split())
        
        # Calculate keyword overlap
        overlap = len(expected_keywords.intersection(actual_keywords))
        total_expected = len(expected_keywords)
        
        # Basic scoring
        keyword_score = (overlap / total_expected) if total_expected > 0 else 0
        
        # Length similarity
        length_ratio = min(len(actual), len(expected)) / max(len(actual), len(expected), 1)
        
        # Tag matching
        tag_matches = sum(1 for tag in tags if tag.lower() in actual.lower())
        tag_score = tag_matches / len(tags) if tags else 1
        
        # Combined confidence score
        confidence = (keyword_score * 0.5 + length_ratio * 0.2 + tag_score * 0.3) * 100
        
        # Pass threshold
        passed = confidence >= 60 and len(actual) > 50
        
        return {
            'confidence': confidence,
            'passed': passed,
            'keyword_score': keyword_score,
            'length_ratio': length_ratio,
            'tag_score': tag_score
        }
    
    async def test_all_agents(self) -> List[AgentTestSummary]:
        """Test all discovered agents"""
        print(f"🚀 Starting tests for {len(self.discovered_agents)} agents...")
        
        summaries = []
        for agent_name in self.discovered_agents:
            summary = await self.test_single_agent(agent_name)
            summaries.append(summary)
            
            # Create GitHub issues for failures
            if summary.failed > 0:
                await self._create_failure_issues(summary)
        
        # Create overall test report
        await self._create_test_report(summaries)
        
        return summaries
    
    async def _create_failure_issues(self, summary: AgentTestSummary):
        """Create GitHub issues for failed tests"""
        if not self.github_token:
            print("⚠️ No GitHub token provided, skipping issue creation")
            return
        
        repo_name = f"{summary.agent_type}-agent"
        
        # Group failures by category
        failures_by_category = {}
        for result in summary.results:
            if not result.passed:
                category = self._extract_category_from_question(result.question)
                if category not in failures_by_category:
                    failures_by_category[category] = []
                failures_by_category[category].append(result)
        
        # Create issue for each category
        for category, failures in failures_by_category.items():
            await self._create_github_issue(
                repo_name=repo_name,
                title=f"Baseline Test Failures - {category.title()}",
                failures=failures,
                summary=summary
            )
    
    def _extract_category_from_question(self, question: str) -> str:
        """Extract category from question content"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['license', 'licensing']):
            return 'licensing'
        elif any(word in question_lower for word in ['label', 'packaging']):
            return 'packaging'
        elif any(word in question_lower for word in ['test', 'testing', 'contaminant']):
            return 'testing'
        elif any(word in question_lower for word in ['transport', 'vehicle']):
            return 'transportation'
        elif any(word in question_lower for word in ['advertis', 'marketing']):
            return 'advertising'
        else:
            return 'general'
    
    async def _create_github_issue(self, repo_name: str, title: str, failures: List[TestResult], summary: AgentTestSummary):
        """Create a GitHub issue for test failures"""
        try:
            url = f"{self.base_url}/repos/{self.github_org}/{repo_name}/issues"
            
            # Build issue body
            body_parts = [
                f"## Baseline Test Failures - {summary.test_timestamp}",
                f"",
                f"**Agent**: {summary.agent_type}",
                f"**Failed Tests**: {len(failures)} out of {summary.total_questions}",
                f"**Average Confidence**: {summary.average_confidence:.1f}%",
                f"",
                f"### Failed Questions:",
                f""
            ]
            
            for failure in failures:
                body_parts.extend([
                    f"#### Question ID: {failure.question_id}",
                    f"**Question**: {failure.question}",
                    f"**Expected**: {failure.expected_answer[:200]}...",
                    f"**Actual**: {failure.actual_answer[:200] if failure.actual_answer else 'No response'}...",
                    f"**Confidence**: {failure.confidence_score:.1f}%",
                    f"**Execution Time**: {failure.execution_time:.2f}s",
                    ""
                ])
                
                if failure.error_message:
                    body_parts.extend([
                        f"**Error**: {failure.error_message}",
                        ""
                    ])
            
            body_parts.extend([
                f"### Recommended Actions:",
                f"1. Review and improve agent prompt for {title.lower()}",
                f"2. Update RAG corpus with more relevant content",
                f"3. Add specific tools for handling these question types",
                f"4. Improve evaluation logic for these scenarios",
                f"",
                f"---",
                f"*Generated automatically by GitHub Tester Agent*"
            ])
            
            issue_data = {
                "title": title,
                "body": "\n".join(body_parts),
                "labels": ["baseline-failure", "testing", "priority-high"]
            }
            
            headers = {
                "Authorization": f"token {self.github_token}",
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=issue_data, headers=headers) as response:
                    if response.status == 201:
                        issue = await response.json()
                        print(f"✅ Created issue #{issue['number']}: {title}")
                    else:
                        print(f"❌ Failed to create issue: {response.status}")
                        
        except Exception as e:
            print(f"❌ Error creating GitHub issue: {str(e)}")
    
    async def _create_test_report(self, summaries: List[AgentTestSummary]):
        """Create overall test report"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        report_filename = f"test_report_{timestamp}.json"
        
        report_data = {
            "test_run_timestamp": datetime.now().isoformat(),
            "total_agents": len(summaries),
            "overall_stats": {
                "total_questions": sum(s.total_questions for s in summaries),
                "total_passed": sum(s.passed for s in summaries),
                "total_failed": sum(s.failed for s in summaries),
                "average_confidence": sum(s.average_confidence for s in summaries) / len(summaries) if summaries else 0,
                "total_execution_time": sum(s.total_execution_time for s in summaries)
            },
            "agent_summaries": [
                {
                    "agent_type": s.agent_type,
                    "total_questions": s.total_questions,
                    "passed": s.passed,
                    "failed": s.failed,
                    "average_confidence": s.average_confidence,
                    "execution_time": s.total_execution_time,
                    "test_timestamp": s.test_timestamp
                }
                for s in summaries
            ]
        }
        
        # Save report
        with open(report_filename, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"📊 Test report saved: {report_filename}")
        
        # Print summary
        stats = report_data["overall_stats"]
        print(f"""
🎯 Test Summary:
- Agents Tested: {len(summaries)}
- Total Questions: {stats['total_questions']}
- Passed: {stats['total_passed']}
- Failed: {stats['total_failed']}
- Success Rate: {(stats['total_passed'] / stats['total_questions'] * 100):.1f}%
- Average Confidence: {stats['average_confidence']:.1f}%
- Total Execution Time: {stats['total_execution_time']:.2f}s
""")


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="GitHub Agent Tester")
    parser.add_argument("--agent", type=str, help="Test specific agent only")
    parser.add_argument("--github-token", type=str, help="GitHub token for issue creation")
    parser.add_argument("--create-issues", action="store_true", help="Create GitHub issues for failures")
    
    args = parser.parse_args()
    
    async def main():
        tester = GitHubTesterAgent(args.github_token)
        
        if args.agent:
            print(f"Testing specific agent: {args.agent}")
            summary = await tester.test_single_agent(args.agent)
            if summary.failed > 0 and args.create_issues:
                await tester._create_failure_issues(summary)
        else:
            print("Testing all agents...")
            summaries = await tester.test_all_agents()
    
    asyncio.run(main())