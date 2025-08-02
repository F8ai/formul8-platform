#!/usr/bin/env python3
"""
Comprehensive Baseline Testing Script for Formul8 Platform

This script can run baseline tests against various configurations:
- Models: OpenAI o3 (default), GPT-4o, Claude, etc.
- States: Dynamic state substitution in questions
- Prompts: Custom system prompts or default
- RAG: Enable/disable RAG retrieval
- Tools: Enable/disable agent tools
- Knowledge Bases: Enable/disable structured KB access

Usage:
    python run_baseline_tests.py --agent compliance-agent --state CA --model gpt-4o
    python run_baseline_tests.py --agent all --model claude-3-sonnet --rag --tools
    python run_baseline_tests.py --help
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Import base agent functionality
sys.path.append('.')
from base_agent import BaseAgent, AgentResponse

class BaselineTestRunner:
    """Comprehensive baseline testing runner with configurable options."""
    
    def __init__(self, 
                 model: str = "gpt-4o",
                 state: Optional[str] = None,
                 custom_prompt: Optional[str] = None,
                 enable_rag: bool = False,
                 enable_tools: bool = False,
                 enable_kb: bool = False):
        """
        Initialize the baseline test runner.
        
        Args:
            model: LLM model to use (default: gpt-4o)
            state: State for {{state}} substitution
            custom_prompt: Custom system prompt override
            enable_rag: Enable RAG retrieval
            enable_tools: Enable agent tools
            enable_kb: Enable knowledge base access
        """
        self.model = model
        self.state = state
        self.custom_prompt = custom_prompt
        self.enable_rag = enable_rag
        self.enable_tools = enable_tools
        self.enable_kb = enable_kb
        
        # Set up logging
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Available models and their configurations
        self.model_configs = {
            "gpt-4o": {"provider": "openai", "model": "gpt-4o", "temperature": 0.3},
            "gpt-4o-mini": {"provider": "openai", "model": "gpt-4o-mini", "temperature": 0.3},
            "o3": {"provider": "openai", "model": "o3", "temperature": 0.1},
            "claude-3-sonnet": {"provider": "anthropic", "model": "claude-3-sonnet-20240229", "temperature": 0.3},
            "claude-3-haiku": {"provider": "anthropic", "model": "claude-3-haiku-20240307", "temperature": 0.3},
            "gemini-pro": {"provider": "google", "model": "gemini-pro", "temperature": 0.3}
        }
        
        # Available agents
        self.available_agents = [
            'compliance-agent',
            'formulation-agent', 
            'marketing-agent',
            'operations-agent',
            'sourcing-agent',
            'patent-agent',
            'science-agent',
            'spectra-agent',
            'customer-success-agent',
            'lms-agent'
        ]
        
    def load_baseline_questions(self, agent_name: str) -> List[Dict[str, Any]]:
        """Load baseline questions for an agent."""
        baseline_file = Path(f"agents/{agent_name}/baseline.json")
        
        if not baseline_file.exists():
            self.logger.warning(f"No baseline.json found for {agent_name}")
            return []
            
        try:
            with open(baseline_file, 'r') as f:
                data = json.load(f)
                questions = data.get('questions', [])
                
                # Apply state substitution if specified
                if self.state:
                    questions = self._substitute_state_placeholders(questions, self.state)
                    
                return questions
        except Exception as e:
            self.logger.error(f"Error loading baseline questions for {agent_name}: {e}")
            return []
    
    def _substitute_state_placeholders(self, questions: List[Dict], state: str) -> List[Dict]:
        """Replace {{state}} placeholders in questions with actual state."""
        for question in questions:
            # Replace in question text
            if 'question' in question:
                question['question'] = question['question'].replace('{{state}}', state)
            
            # Replace in expected answer
            if 'expected_answer' in question:
                question['expected_answer'] = question['expected_answer'].replace('{{state}}', state)
            
            # Update state field
            if question.get('state') == '{{state}}':
                question['state'] = state
                
        return questions
    
    def _get_system_prompt(self, agent_name: str) -> str:
        """Get system prompt for an agent."""
        if self.custom_prompt:
            return self.custom_prompt
            
        # Load agent-specific configuration
        config_file = Path(f"agents/{agent_name}/agent_config.yaml")
        if config_file.exists():
            try:
                import yaml
                with open(config_file, 'r') as f:
                    config = yaml.safe_load(f)
                    return config.get('system_prompt', self._get_default_prompt(agent_name))
            except:
                pass
                
        return self._get_default_prompt(agent_name)
    
    def _get_default_prompt(self, agent_name: str) -> str:
        """Get default system prompt for an agent."""
        prompts = {
            'compliance-agent': "You are a cannabis compliance expert. Provide accurate, current regulatory guidance based on state and local laws. Always cite specific regulations when possible.",
            'formulation-agent': "You are a cannabis formulation scientist. Provide technical guidance on product development, extraction methods, and chemical analysis.",
            'marketing-agent': "You are a cannabis marketing expert. Provide compliant marketing strategies that adhere to advertising restrictions while building brand awareness.",
            'operations-agent': "You are a cannabis operations expert. Provide guidance on facility management, supply chain optimization, and business operations.",
            'sourcing-agent': "You are a cannabis sourcing expert. Provide guidance on vendor selection, supply chain management, and procurement strategies.",
            'patent-agent': "You are a cannabis IP expert. Provide guidance on patent strategy, trademark protection, and intellectual property management.",
            'science-agent': "You are a cannabis research scientist. Provide evidence-based guidance using current scientific literature and research findings.",
            'spectra-agent': "You are a cannabis analytical chemistry expert. Provide guidance on spectral analysis, CoA interpretation, and analytical testing.",
            'customer-success-agent': "You are a cannabis customer success expert. Provide guidance on customer support, retention strategies, and service optimization."
        }
        
        return prompts.get(agent_name, f"You are a {agent_name.replace('-', ' ')} expert in the cannabis industry.")
    
    def _initialize_llm(self):
        """Initialize the appropriate LLM based on model configuration."""
        config = self.model_configs.get(self.model)
        if not config:
            raise ValueError(f"Unsupported model: {self.model}")
            
        provider = config["provider"]
        
        if provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=config["model"],
                temperature=config["temperature"],
                api_key=os.getenv("OPENAI_API_KEY")
            )
        elif provider == "anthropic":
            try:
                from langchain_anthropic import ChatAnthropic
                return ChatAnthropic(
                    model=config["model"],
                    temperature=config["temperature"],
                    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
                )
            except ImportError:
                self.logger.warning("langchain_anthropic not installed. Install with: pip install langchain-anthropic")
                # Fallback to OpenAI
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(model="gpt-4o", temperature=0.3)
        elif provider == "google":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=config["model"],
                    temperature=config["temperature"],
                    google_api_key=os.getenv("GOOGLE_API_KEY")
                )
            except ImportError:
                self.logger.warning("langchain_google_genai not installed. Install with: pip install langchain-google-genai")
                # Fallback to OpenAI
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(model="gpt-4o", temperature=0.3)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _load_rag_context(self, agent_name: str, question: str) -> str:
        """Load RAG context if enabled."""
        if not self.enable_rag:
            return ""
            
        # Check for existing RAG implementation
        rag_dir = Path(f"agents/{agent_name}/rag")
        if not rag_dir.exists():
            return ""
            
        # Try to load corpus or vector store
        corpus_file = rag_dir / "corpus.jsonl"
        if corpus_file.exists():
            try:
                # Simple keyword-based retrieval from corpus
                relevant_docs = []
                with open(corpus_file, 'r') as f:
                    for line in f:
                        doc = json.loads(line)
                        # Simple relevance check
                        if any(word.lower() in doc.get('content', '').lower() 
                              for word in question.split() if len(word) > 3):
                            relevant_docs.append(doc.get('content', '')[:500])
                            
                if relevant_docs:
                    return "\n\nRelevant Context:\n" + "\n".join(relevant_docs[:3])
            except Exception as e:
                self.logger.warning(f"Error loading RAG context: {e}")
                
        return ""
    
    def _load_kb_context(self, agent_name: str, question: str) -> str:
        """Load knowledge base context if enabled."""
        if not self.enable_kb:
            return ""
            
        kb_file = Path(f"agents/{agent_name}/knowledge_base.ttl")
        if not kb_file.exists():
            return ""
            
        try:
            # Simple TTL content extraction
            with open(kb_file, 'r') as f:
                content = f.read()
                
            # Extract relevant triples (simplified)
            lines = content.split('\n')
            relevant_lines = [line for line in lines 
                            if any(word.lower() in line.lower() 
                                  for word in question.split() if len(word) > 3)]
            
            if relevant_lines:
                return "\n\nKnowledge Base Context:\n" + "\n".join(relevant_lines[:5])
                
        except Exception as e:
            self.logger.warning(f"Error loading KB context: {e}")
            
        return ""
    
    async def run_single_test(self, agent_name: str, question: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single baseline test."""
        try:
            # Initialize LLM
            llm = self._initialize_llm()
            
            # Prepare system prompt
            system_prompt = self._get_system_prompt(agent_name)
            
            # Add RAG context if enabled
            rag_context = self._load_rag_context(agent_name, question['question'])
            
            # Add KB context if enabled
            kb_context = self._load_kb_context(agent_name, question['question'])
            
            # Prepare enhanced prompt
            enhanced_prompt = system_prompt
            if rag_context:
                enhanced_prompt += rag_context
            if kb_context:
                enhanced_prompt += kb_context
                
            # Create agent instance
            agent = BaseAgent(agent_name, enhanced_prompt, os.getenv("OPENAI_API_KEY"))
            agent.llm = llm  # Override with specified model
            
            # Process the question
            start_time = time.time()
            response = agent.process_query(question['question'])
            end_time = time.time()
            
            # Calculate accuracy score (simplified)
            accuracy_score = self._calculate_accuracy(question, response.response)
            
            return {
                'question_id': question.get('id', 'unknown'),
                'question': question['question'],
                'expected_answer': question.get('expected_answer', ''),
                'agent_response': response.response,
                'confidence': response.confidence,
                'accuracy': accuracy_score,
                'response_time': round(end_time - start_time, 2),
                'model': self.model,
                'state': self.state or 'MULTI',
                'rag_enabled': self.enable_rag,
                'tools_enabled': self.enable_tools,
                'kb_enabled': self.enable_kb,
                'category': question.get('category', 'unknown'),
                'difficulty': question.get('difficulty', 'unknown'),
                'max_score': question.get('max_score', 10),
                'metadata': response.metadata
            }
            
        except Exception as e:
            self.logger.error(f"Error running test for question {question.get('id', 'unknown')}: {e}")
            return {
                'question_id': question.get('id', 'unknown'),
                'error': str(e),
                'model': self.model,
                'state': self.state or 'MULTI'
            }
    
    def _calculate_accuracy(self, question: Dict[str, Any], response: str) -> float:
        """Calculate accuracy score by comparing response to expected answer."""
        expected = question.get('expected_answer', '').lower()
        actual = response.lower()
        
        if not expected:
            return 50.0  # Default score if no expected answer
            
        # Simple keyword matching
        expected_words = set(expected.split())
        actual_words = set(actual.split())
        
        # Remove common words
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        expected_words -= common_words
        actual_words -= common_words
        
        if not expected_words:
            return 50.0
            
        # Calculate overlap
        overlap = len(expected_words.intersection(actual_words))
        score = (overlap / len(expected_words)) * 100
        
        return min(100.0, max(0.0, score))
    
    async def run_agent_baseline(self, agent_name: str) -> Dict[str, Any]:
        """Run complete baseline test suite for an agent."""
        self.logger.info(f"Running baseline tests for {agent_name}")
        
        # Load questions
        questions = self.load_baseline_questions(agent_name)
        if not questions:
            return {
                'agent': agent_name,
                'error': 'No baseline questions found',
                'total_questions': 0
            }
        
        # Run tests
        results = []
        for i, question in enumerate(questions):
            self.logger.info(f"Testing question {i+1}/{len(questions)}: {question.get('id', 'unknown')}")
            result = await self.run_single_test(agent_name, question)
            results.append(result)
            
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.1)
        
        # Calculate summary statistics
        valid_results = [r for r in results if 'error' not in r]
        
        if valid_results:
            avg_accuracy = sum(r['accuracy'] for r in valid_results) / len(valid_results)
            avg_confidence = sum(r['confidence'] for r in valid_results) / len(valid_results)
            avg_response_time = sum(r['response_time'] for r in valid_results) / len(valid_results)
            
            # Category breakdown
            categories = {}
            for r in valid_results:
                cat = r['category']
                if cat not in categories:
                    categories[cat] = {'count': 0, 'avg_accuracy': 0, 'avg_confidence': 0}
                categories[cat]['count'] += 1
                categories[cat]['avg_accuracy'] += r['accuracy']
                categories[cat]['avg_confidence'] += r['confidence']
            
            for cat in categories:
                categories[cat]['avg_accuracy'] /= categories[cat]['count']
                categories[cat]['avg_confidence'] /= categories[cat]['count']
        else:
            avg_accuracy = 0
            avg_confidence = 0
            avg_response_time = 0
            categories = {}
        
        return {
            'agent': agent_name,
            'timestamp': datetime.now().isoformat(),
            'model': self.model,
            'state': self.state or 'MULTI',
            'configuration': {
                'rag_enabled': self.enable_rag,
                'tools_enabled': self.enable_tools,
                'kb_enabled': self.enable_kb,
                'custom_prompt': bool(self.custom_prompt)
            },
            'summary': {
                'total_questions': len(questions),
                'successful_tests': len(valid_results),
                'failed_tests': len(results) - len(valid_results),
                'avg_accuracy': round(avg_accuracy, 2),
                'avg_confidence': round(avg_confidence, 2),
                'avg_response_time': round(avg_response_time, 2)
            },
            'category_breakdown': categories,
            'detailed_results': results
        }
    
    def save_results(self, agent_name: str, results: Dict[str, Any]):
        """Save test results to file."""
        output_dir = Path(f"agents/{agent_name}")
        output_dir.mkdir(exist_ok=True)
        
        # Generate filename with configuration
        config_suffix = []
        if self.state:
            config_suffix.append(f"state_{self.state}")
        if self.model != "gpt-4o":
            config_suffix.append(f"model_{self.model.replace('-', '_')}")
        if self.enable_rag:
            config_suffix.append("rag")
        if self.enable_tools:
            config_suffix.append("tools")
        if self.enable_kb:
            config_suffix.append("kb")
            
        suffix = "_" + "_".join(config_suffix) if config_suffix else ""
        
        output_file = output_dir / f"baseline_results{suffix}.json"
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
            
        self.logger.info(f"Results saved to {output_file}")

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description="Run baseline tests for Formul8 agents")
    
    parser.add_argument('--agent', '-a', type=str, default='compliance-agent',
                       help='Agent to test (or "all" for all agents)')
    parser.add_argument('--model', '-m', type=str, default='gpt-4o',
                       choices=['gpt-4o', 'gpt-4o-mini', 'o3', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro'],
                       help='LLM model to use')
    parser.add_argument('--state', '-s', type=str,
                       help='State for {{state}} substitution (e.g., CA, NY, CO)')
    parser.add_argument('--prompt', '-p', type=str,
                       help='Custom system prompt file or text')
    parser.add_argument('--rag', action='store_true',
                       help='Enable RAG retrieval')
    parser.add_argument('--tools', action='store_true',
                       help='Enable agent tools')
    parser.add_argument('--kb', action='store_true',
                       help='Enable knowledge base access')
    parser.add_argument('--output', '-o', type=str,
                       help='Output directory for results')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose logging')
    
    args = parser.parse_args()
    
    # Load custom prompt if specified
    custom_prompt = None
    if args.prompt:
        if os.path.exists(args.prompt):
            with open(args.prompt, 'r') as f:
                custom_prompt = f.read()
        else:
            custom_prompt = args.prompt
    
    # Initialize test runner
    runner = BaselineTestRunner(
        model=args.model,
        state=args.state,
        custom_prompt=custom_prompt,
        enable_rag=args.rag,
        enable_tools=args.tools,
        enable_kb=args.kb
    )
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    async def run_tests():
        if args.agent == 'all':
            for agent_name in runner.available_agents:
                if Path(f"agents/{agent_name}").exists():
                    results = await runner.run_agent_baseline(agent_name)
                    runner.save_results(agent_name, results)
                    print(f"\n{agent_name} Results:")
                    print(f"  Accuracy: {results['summary']['avg_accuracy']:.1f}%")
                    print(f"  Confidence: {results['summary']['avg_confidence']:.1f}%")
                    print(f"  Tests: {results['summary']['successful_tests']}/{results['summary']['total_questions']}")
        else:
            results = await runner.run_agent_baseline(args.agent)
            runner.save_results(args.agent, results)
            
            print(f"\n{args.agent} Baseline Test Results:")
            print(f"Model: {args.model}")
            if args.state:
                print(f"State: {args.state}")
            print(f"Configuration: RAG={args.rag}, Tools={args.tools}, KB={args.kb}")
            print(f"Accuracy: {results['summary']['avg_accuracy']:.1f}%")
            print(f"Confidence: {results['summary']['avg_confidence']:.1f}%")
            print(f"Response Time: {results['summary']['avg_response_time']:.2f}s")
            print(f"Success Rate: {results['summary']['successful_tests']}/{results['summary']['total_questions']}")
            
            if results.get('category_breakdown'):
                print("\nCategory Breakdown:")
                for cat, stats in results['category_breakdown'].items():
                    print(f"  {cat}: {stats['avg_accuracy']:.1f}% accuracy ({stats['count']} questions)")
    
    # Run the tests
    asyncio.run(run_tests())

if __name__ == "__main__":
    main()