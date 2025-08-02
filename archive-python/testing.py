"""
Baseline Testing Framework
Provides standardized testing capabilities for all agents
"""

import json
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class TestResult:
    """Individual test result"""
    id: str
    run_id: str
    question_id: str
    question: str
    expected_answer: str
    agent_response: str
    category: str
    difficulty: str
    accuracy: float
    confidence: float
    response_time: float
    manual_grade: Optional[float]
    ai_grade: Optional[float]
    ai_grading_confidence: Optional[float]
    max_score: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost: float
    ai_grading_cost: float
    model: str
    created_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass 
class TestRun:
    """Test run metadata"""
    id: str
    agent_type: str
    model: str
    state: str
    status: str
    total_questions: int
    successful_tests: int
    avg_accuracy: float
    avg_confidence: float
    avg_response_time: float
    total_cost: float
    created_at: str


class BaselineTestRunner:
    """Runs baseline tests for agents using real API calls"""
    
    def __init__(self, agent, storage_path: str = None):
        self.agent = agent
        self.storage_path = storage_path or os.path.join(agent.agent_path, "data", "results")
        os.makedirs(self.storage_path, exist_ok=True)
    
    async def run_test_suite(self, state: str = "CO", model: str = None) -> Dict[str, Any]:
        """Run complete baseline test suite"""
        model_name = model or self.agent.default_model
        run_id = f"{int(datetime.now().timestamp())}"
        
        # Create test run
        test_run = TestRun(
            id=run_id,
            agent_type=self.agent.agent_type,
            model=model_name,
            state=state,
            status="running",
            total_questions=len(self.agent.baseline_questions),
            successful_tests=0,
            avg_accuracy=0.0,
            avg_confidence=0.0,
            avg_response_time=0.0,
            total_cost=0.0,
            created_at=datetime.now().isoformat()
        )
        
        results = []
        total_cost = 0.0
        total_accuracy = 0.0
        total_confidence = 0.0
        total_response_time = 0.0
        successful_tests = 0
        
        # Run tests for each question
        for i, question_data in enumerate(self.agent.baseline_questions):
            try:
                # Prepare question with state substitution
                question_text = question_data.get("question", "").replace("{{state}}", state)
                
                # Run the test
                response = await self.agent.process_query(question_text, model=model_name)
                
                # Grade the response (simplified)
                ai_grade = await self._grade_response(
                    question_text, 
                    question_data.get("expected_answer", ""),
                    response.response,
                    model_name
                )
                
                # Create test result
                result = TestResult(
                    id=str(i + 1),
                    run_id=run_id,
                    question_id=question_data.get("id", f"q{i+1}"),
                    question=question_text,
                    expected_answer=question_data.get("expected_answer", ""),
                    agent_response=response.response,
                    category=question_data.get("category", "general"),
                    difficulty=question_data.get("difficulty", "intermediate"),
                    accuracy=ai_grade.get("score", 0),
                    confidence=response.confidence,
                    response_time=response.response_time * 1000,  # Convert to ms
                    manual_grade=None,
                    ai_grade=ai_grade.get("score", 0),
                    ai_grading_confidence=ai_grade.get("confidence", 0),
                    max_score=100,
                    input_tokens=self._estimate_tokens(question_text),
                    output_tokens=self._estimate_tokens(response.response),
                    total_tokens=self._estimate_tokens(question_text + response.response),
                    estimated_cost=response.cost,
                    ai_grading_cost=ai_grade.get("cost", 0.001),
                    model=model_name,
                    created_at=datetime.now().isoformat()
                )
                
                results.append(result)
                
                # Update totals
                total_cost += response.cost + ai_grade.get("cost", 0.001)
                total_accuracy += ai_grade.get("score", 0)
                total_confidence += response.confidence
                total_response_time += response.response_time
                
                if ai_grade.get("score", 0) >= 70:  # Consider 70%+ as successful
                    successful_tests += 1
                    
            except Exception as e:
                print(f"Error running test {i+1}: {e}")
                continue
        
        # Update test run with final metrics
        if results:
            test_run.successful_tests = successful_tests
            test_run.avg_accuracy = total_accuracy / len(results)
            test_run.avg_confidence = total_confidence / len(results)
            test_run.avg_response_time = total_response_time / len(results)
            test_run.total_cost = total_cost
            test_run.status = "completed"
        
        # Save results
        await self._save_results(test_run, results, state, model_name)
        
        return {
            "testRun": asdict(test_run),
            "results": [result.to_dict() for result in results]
        }
    
    async def _grade_response(self, question: str, expected: str, 
                            response: str, model: str) -> Dict[str, Any]:
        """Grade agent response using AI"""
        grading_prompt = f"""
        Grade this response on a scale of 0-100 based on:
        - Accuracy (40%): How factually correct is the response?
        - Completeness (30%): Does it address all aspects of the question?
        - Relevance (20%): How relevant is the response to the question?
        - Clarity (10%): How clear and well-structured is the response?
        
        Question: {question}
        Expected Answer: {expected}
        Agent Response: {response}
        
        Respond with JSON: {{"score": <0-100>, "confidence": <0.0-1.0>, "feedback": "brief explanation"}}
        """
        
        try:
            # Use a simple model for grading to keep costs down
            grading_response = await self.agent.process_query(
                grading_prompt, 
                model="gpt-4o-mini"
            )
            
            # Parse JSON response
            result = json.loads(grading_response.response)
            result["cost"] = grading_response.cost
            return result
            
        except Exception as e:
            # Fallback scoring
            return {
                "score": 65,  # Conservative default
                "confidence": 0.5,
                "feedback": f"Auto-grading failed: {e}",
                "cost": 0.001
            }
    
    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation"""
        return int(len(text.split()) * 1.3)
    
    async def _save_results(self, test_run: TestRun, results: List[TestResult], 
                          state: str, model: str):
        """Save test results to JSON file"""
        filename = f"{state}-{model.replace(':', '-')}.json"
        filepath = os.path.join(self.storage_path, filename)
        
        data = {
            "testRun": asdict(test_run),
            "results": [result.to_dict() for result in results]
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Results saved to: {filepath}")
    
    def load_results(self, state: str, model: str) -> Optional[Dict[str, Any]]:
        """Load test results from JSON file"""
        filename = f"{state}-{model.replace(':', '-')}.json"
        filepath = os.path.join(self.storage_path, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        return None
    
    def get_available_results(self) -> List[str]:
        """Get list of available result files"""
        if not os.path.exists(self.storage_path):
            return []
        
        return [f for f in os.listdir(self.storage_path) if f.endswith('.json')]