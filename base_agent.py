#!/usr/bin/env python3
"""
Base Agent for Formul8 Platform

Common base class and utilities for all Formul8 agents.
"""

import json
from typing import Dict, Any, Optional
import openai
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

class AgentResponse:
    """Standard response format for all agents."""
    
    def __init__(self, agent: str, response: str, confidence: float, 
                 sources: Optional[list] = None, metadata: Optional[Dict[str, Any]] = None,
                 requires_human_verification: bool = False):
        self.agent = agent
        self.response = response
        self.confidence = confidence
        self.sources = sources or []
        self.metadata = metadata or {}
        self.requires_human_verification = requires_human_verification
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "agent": self.agent,
            "response": self.response,
            "confidence": self.confidence,
            "sources": self.sources,
            "metadata": self.metadata,
            "requiresHumanVerification": self.requires_human_verification
        }

class BaseAgent:
    """Base class for all Formul8 agents."""
    
    def __init__(self, agent_type: str, system_prompt: str, api_key: Optional[str] = None):
        """Initialize the base agent."""
        self.agent_type = agent_type
        self.system_prompt = system_prompt
        
        if api_key:
            openai.api_key = api_key
            self.llm = ChatOpenAI(api_key=api_key, model="gpt-4o", temperature=0.3)
        else:
            self.llm = None
    
    def process_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """Process a query and return a standardized response."""
        try:
            if self.llm is None:
                return AgentResponse(
                    agent=self.agent_type,
                    response="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
                    confidence=0,
                    metadata={"error": "API key not configured"}
                )
            
            # Prepare the prompt
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=query)
            ]
            
            # Get response from OpenAI
            response = self.llm.invoke(messages)
            
            # Parse and structure the response
            result = AgentResponse(
                agent=self.agent_type,
                response=response.content,
                confidence=self._calculate_confidence(response.content),
                sources=self._extract_sources(response.content),
                metadata={
                    "query": query,
                    "context": context,
                    "model": "gpt-4o"
                }
            )
            
            return result
            
        except Exception as e:
            return AgentResponse(
                agent=self.agent_type,
                response=f"Error processing query: {str(e)}",
                confidence=0,
                metadata={"error": str(e)}
            )
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score for the response."""
        if not response or len(response) < 10:
            return 0.0
        
        # Simple heuristic: longer, more detailed responses get higher confidence
        confidence = min(95.0, max(50.0, len(response) / 10))
        
        return min(95.0, confidence)
    
    def _extract_sources(self, response: str) -> list:
        """Extract potential sources from the response."""
        sources = []
        
        # Look for common source patterns
        source_patterns = ['http', 'www', 'doi:', 'PMID:', 'PMC']
        for pattern in source_patterns:
            if pattern.lower() in response.lower():
                sources.append(pattern)
        
        return list(set(sources))
    
    def run_baseline_tests(self, test_queries: list) -> Dict[str, Any]:
        """Run baseline tests to evaluate agent performance."""
        results = []
        for query in test_queries:
            result = self.process_query(query)
            results.append({
                "query": query,
                "confidence": result.confidence,
                "response_length": len(result.response)
            })
        
        avg_confidence = sum(r["confidence"] for r in results) / len(results)
        
        return {
            "total_tests": len(test_queries),
            "average_confidence": avg_confidence,
            "results": results
        } 