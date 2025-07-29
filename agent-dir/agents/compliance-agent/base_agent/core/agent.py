
"""
Base Agent Core Class
Shared functionality for all specialized agents
"""

import os
import yaml
from typing import List, Dict, Any, Optional
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
import time

class BaseAgent:
    """Base class for all specialized agents"""
    
    def __init__(self, agent_name: str, description: str, domain: str, agent_path: str = "."):
        self.agent_name = agent_name
        self.description = description
        self.domain = domain
        self.agent_path = agent_path
        self.tools = []
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        self.llm = None
        self.agent = None
        self.retriever = None
        
        # Initialize base components
        self._initialize_llm()
        self._initialize_agent()
    
    def _initialize_llm(self):
        """Initialize the language model"""
        try:
            self.llm = OpenAI(temperature=0.1, model_name="gpt-3.5-turbo-instruct")
        except Exception as e:
            print(f"Warning: Could not initialize OpenAI LLM: {e}")
            # Use a mock LLM for development
            self.llm = MockLLM()
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        if self.llm and self.tools:
            try:
                self.agent = initialize_agent(
                    tools=self.tools,
                    llm=self.llm,
                    agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
                    memory=self.memory,
                    verbose=True
                )
            except Exception as e:
                print(f"Warning: Could not initialize agent: {e}")
    
    async def process_query(self, user_id: str, query: str) -> Dict[str, Any]:
        """Process a user query and return response with metadata"""
        start_time = time.time()
        
        try:
            if self.agent:
                response = self.agent.run(query)
            else:
                # Fallback response for development
                response = f"Mock response for: {query}"
            
            response_time = time.time() - start_time
            
            return {
                "response": response,
                "confidence": 0.62,  # Mock confidence score
                "response_time": round(response_time, 2),
                "user_id": user_id,
                "agent": self.agent_name
            }
        except Exception as e:
            return {
                "response": f"Error processing query: {str(e)}",
                "confidence": 0.0,
                "response_time": time.time() - start_time,
                "user_id": user_id,
                "agent": self.agent_name,
                "error": True
            }
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        return f"You are {self.agent_name}, specialized in {self.domain}. {self.description}"

class MockLLM:
    """Mock LLM for development when OpenAI is not available"""
    
    def __call__(self, prompt: str) -> str:
        return f"Mock response to: {prompt[:100]}..."
    
    def run(self, prompt: str) -> str:
        return self.__call__(prompt)

def load_config(config_path: str) -> Any:
    """Load YAML configuration file"""
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Warning: Could not load config from {config_path}: {e}")
        # Return mock config
        class MockConfig:
            def __init__(self):
                self.agent = MockAgent()
        
        class MockAgent:
            def __init__(self):
                self.name = "mock-agent"
                self.description = "Mock agent for development"
                self.domain = "General"
        
        return MockConfig()
