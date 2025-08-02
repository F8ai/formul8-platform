"""
Base Agent Core Class
Provides standardized agent functionality for all Formul8 specialized agents
"""

import os
import json
import yaml
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory


@dataclass
class AgentResponse:
    """Standardized response format for all agents"""
    agent_type: str
    response: str
    confidence: float
    response_time: float
    cost: float
    model: str
    sources: List[str] = None
    metadata: Dict[str, Any] = None
    requires_verification: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent": self.agent_type,
            "response": self.response,
            "confidence": self.confidence,
            "responseTime": self.response_time,
            "cost": self.cost,
            "model": self.model,
            "sources": self.sources or [],
            "metadata": self.metadata or {},
            "requiresVerification": self.requires_verification
        }


class BaseAgent:
    """Base class for all Formul8 specialized agents"""
    
    def __init__(self, agent_type: str, domain: str, description: str, 
                 agent_path: str = ".", default_model: str = "gpt-4o"):
        self.agent_type = agent_type
        self.domain = domain
        self.description = description
        self.agent_path = agent_path
        self.default_model = default_model
        
        # Initialize components
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        self.models = {}
        self.baseline_questions = []
        
        # Load configuration
        self._load_config()
        self._initialize_models()
        self._load_baseline_questions()
    
    def _load_config(self):
        """Load agent configuration from YAML file"""
        config_path = os.path.join(self.agent_path, "agent_config.yaml")
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        else:
            self.config = self._default_config()
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for agents"""
        return {
            "models": {
                "gpt-4o": {"provider": "openai", "temperature": 0.3},
                "gpt-4o-mini": {"provider": "openai", "temperature": 0.3},
                "claude-3-5-sonnet": {"provider": "anthropic", "temperature": 0.3},
                "gemini-2.5-pro": {"provider": "google", "temperature": 0.3}
            },
            "system_prompt": f"You are a specialized {self.domain} AI agent providing expert guidance.",
            "max_tokens": 1000,
            "timeout": 30
        }
    
    def _initialize_models(self):
        """Initialize AI models based on configuration"""
        try:
            # OpenAI models
            if os.getenv("OPENAI_API_KEY"):
                for model_name, config in self.config["models"].items():
                    if config["provider"] == "openai":
                        self.models[model_name] = ChatOpenAI(
                            model=model_name,
                            temperature=config["temperature"],
                            max_tokens=self.config["max_tokens"]
                        )
            
            # Anthropic models  
            if os.getenv("ANTHROPIC_API_KEY"):
                for model_name, config in self.config["models"].items():
                    if config["provider"] == "anthropic":
                        self.models[model_name] = ChatAnthropic(
                            model=model_name,
                            temperature=config["temperature"],
                            max_tokens=self.config["max_tokens"]
                        )
            
            # Google models
            if os.getenv("GEMINI_API_KEY"):
                for model_name, config in self.config["models"].items():
                    if config["provider"] == "google":
                        self.models[model_name] = ChatGoogleGenerativeAI(
                            model=model_name,
                            temperature=config["temperature"],
                            max_tokens=self.config["max_tokens"]
                        )
                        
        except Exception as e:
            print(f"Warning: Could not initialize some models: {e}")
    
    def _load_baseline_questions(self):
        """Load baseline questions from baseline.json"""
        baseline_path = os.path.join(self.agent_path, "baseline.json")
        if os.path.exists(baseline_path):
            with open(baseline_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and 'questions' in data:
                    self.baseline_questions = data['questions']
                elif isinstance(data, list):
                    self.baseline_questions = data
    
    async def process_query(self, query: str, model: str = None, 
                          context: Dict[str, Any] = None) -> AgentResponse:
        """Process a user query with specified model"""
        start_time = datetime.now()
        model_name = model or self.default_model
        
        if model_name not in self.models:
            return AgentResponse(
                agent_type=self.agent_type,
                response=f"Model {model_name} not available. Check API keys.",
                confidence=0.0,
                response_time=0.0,
                cost=0.0,
                model=model_name,
                requires_verification=True
            )
        
        try:
            # Prepare messages
            system_prompt = self.config.get("system_prompt", "")
            if context:
                system_prompt += f"\n\nContext: {json.dumps(context)}"
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=query)
            ]
            
            # Get response from model
            response = await self.models[model_name].ainvoke(messages)
            
            # Calculate metrics
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            # Estimate cost (simplified - real implementation would use token counting)
            cost = self._estimate_cost(query, response.content, model_name)
            
            # Calculate confidence (simplified heuristic)
            confidence = min(0.95, max(0.3, len(response.content) / 500))
            
            return AgentResponse(
                agent_type=self.agent_type,
                response=response.content,
                confidence=confidence,
                response_time=response_time,
                cost=cost,
                model=model_name
            )
            
        except Exception as e:
            return AgentResponse(
                agent_type=self.agent_type,
                response=f"Error processing query: {str(e)}",
                confidence=0.0,
                response_time=(datetime.now() - start_time).total_seconds(),
                cost=0.0,
                model=model_name,
                requires_verification=True
            )
    
    def _estimate_cost(self, input_text: str, output_text: str, model: str) -> float:
        """Estimate API cost based on text length and model"""
        # Simplified cost estimation (real implementation would use tiktoken)
        input_tokens = len(input_text.split()) * 1.3  # Rough token estimate
        output_tokens = len(output_text.split()) * 1.3
        
        # Cost per 1K tokens (approximate)
        costs = {
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "claude-3-5-sonnet": {"input": 0.003, "output": 0.015},
            "gemini-2.5-pro": {"input": 0.00125, "output": 0.005}
        }
        
        if model in costs:
            input_cost = (input_tokens / 1000) * costs[model]["input"]
            output_cost = (output_tokens / 1000) * costs[model]["output"]
            return round(input_cost + output_cost, 6)
        
        return 0.01  # Default estimate
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return list(self.models.keys())
    
    def get_baseline_question_count(self) -> int:
        """Get number of baseline questions"""
        return len(self.baseline_questions)
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "type": self.agent_type,
            "domain": self.domain,
            "description": self.description,
            "available_models": self.get_available_models(),
            "baseline_questions": self.get_baseline_question_count(),
            "status": "operational" if self.models else "models_unavailable"
        }