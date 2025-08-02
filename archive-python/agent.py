#!/usr/bin/env python3
"""
Metabolomics Agent for Formul8 Platform

Specialized AI agent for metabolomics data analysis and interpretation.
"""

import argparse
import json
import sys
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski
import openai
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

class MetabolomicsAgent:
    """AI agent specialized in metabolomics data analysis and interpretation."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the metabolomics agent."""
        self.agent_type = "metabolomics"
        self.system_prompt = """You are a specialized AI agent for metabolomics data analysis and interpretation. 
        You can analyze metabolomics datasets, perform pathway analysis, identify metabolites, and provide 
        statistical insights. You have expertise in:
        - Metabolite identification and annotation
        - Pathway analysis and enrichment
        - Statistical analysis of metabolomics data
        - Integration with metabolomics databases
        - Data visualization and interpretation
        
        Always provide clear, scientific explanations and cite relevant databases or literature when possible."""
        
        if api_key:
            openai.api_key = api_key
            self.llm = ChatOpenAI(api_key=api_key, model="gpt-4o", temperature=0.3)
        else:
            self.llm = None
    
    def process_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a metabolomics-related query."""
        try:
            if self.llm is None:
                return {
                    "agent": self.agent_type,
                    "response": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
                    "confidence": 0,
                    "sources": [],
                    "metadata": {"error": "API key not configured"}
                }
            
            # Prepare the prompt
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=query)
            ]
            
            # Get response from OpenAI
            response = self.llm.invoke(messages)
            
            # Parse and structure the response
            result = {
                "agent": self.agent_type,
                "response": response.content,
                "confidence": self._calculate_confidence(response.content),
                "sources": self._extract_sources(response.content),
                "metadata": {
                    "query": query,
                    "context": context,
                    "model": "gpt-4o"
                }
            }
            
            return result
            
        except Exception as e:
            return {
                "agent": self.agent_type,
                "response": f"Error processing query: {str(e)}",
                "confidence": 0,
                "sources": [],
                "metadata": {"error": str(e)}
            }
    
    def analyze_metabolomics_data(self, data_path: str) -> Dict[str, Any]:
        """Analyze metabolomics data from a file."""
        try:
            # Read data based on file extension
            if data_path.endswith('.csv'):
                data = pd.read_csv(data_path)
            elif data_path.endswith('.tsv'):
                data = pd.read_csv(data_path, sep='\t')
            elif data_path.endswith('.xlsx'):
                data = pd.read_excel(data_path)
            else:
                raise ValueError(f"Unsupported file format: {data_path}")
            
            # Basic analysis
            analysis = {
                "data_shape": data.shape,
                "columns": list(data.columns),
                "missing_values": data.isnull().sum().to_dict(),
                "data_types": data.dtypes.to_dict(),
                "summary_stats": data.describe().to_dict()
            }
            
            return analysis
            
        except Exception as e:
            return {"error": f"Failed to analyze data: {str(e)}"}
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score for the response."""
        if not response or len(response) < 10:
            return 0.0
        
        # Simple heuristic: longer, more detailed responses get higher confidence
        confidence = min(95.0, max(50.0, len(response) / 10))
        
        # Boost confidence if response contains scientific terms
        scientific_terms = ['metabolite', 'pathway', 'analysis', 'statistical', 'database', 'annotation']
        term_count = sum(1 for term in scientific_terms if term.lower() in response.lower())
        confidence += term_count * 5
        
        return min(95.0, confidence)
    
    def _extract_sources(self, response: str) -> list:
        """Extract potential sources from the response."""
        sources = []
        
        # Look for database mentions
        databases = ['HMDB', 'KEGG', 'PubChem', 'ChEBI', 'MetaboLights', 'MassBank']
        for db in databases:
            if db.lower() in response.lower():
                sources.append(db)
        
        return list(set(sources))
    
    def run_baseline_tests(self) -> Dict[str, Any]:
        """Run baseline tests to evaluate agent performance."""
        test_queries = [
            "What is metabolomics and how is it used in cannabis research?",
            "How do you identify metabolites in mass spectrometry data?",
            "What are the key pathways involved in terpene biosynthesis?",
            "How do you perform statistical analysis on metabolomics data?",
            "What databases are commonly used for metabolite annotation?"
        ]
        
        results = []
        for query in test_queries:
            result = self.process_query(query)
            results.append({
                "query": query,
                "confidence": result["confidence"],
                "response_length": len(result["response"])
            })
        
        avg_confidence = sum(r["confidence"] for r in results) / len(results)
        
        return {
            "total_tests": len(test_queries),
            "average_confidence": avg_confidence,
            "results": results
        }

def main():
    """Main entry point for the metabolomics agent."""
    parser = argparse.ArgumentParser(description="Metabolomics Agent for Formul8 Platform")
    parser.add_argument("--query", "-q", help="Query to process")
    parser.add_argument("--interactive", "-i", action="store_true", help="Run in interactive mode")
    parser.add_argument("--test", "-t", action="store_true", help="Run baseline tests")
    parser.add_argument("--data", "-d", help="Path to metabolomics data file for analysis")
    parser.add_argument("--api-key", help="OpenAI API key")
    
    args = parser.parse_args()
    
    # Initialize agent
    agent = MetabolomicsAgent(api_key=args.api_key)
    
    if args.test:
        print("Running baseline tests...")
        results = agent.run_baseline_tests()
        print(json.dumps(results, indent=2))
        
    elif args.data:
        print(f"Analyzing data from: {args.data}")
        results = agent.analyze_metabolomics_data(args.data)
        print(json.dumps(results, indent=2))
        
    elif args.query:
        print(f"Processing query: {args.query}")
        result = agent.process_query(args.query)
        print(json.dumps(result, indent=2))
        
    elif args.interactive:
        print("Metabolomics Agent - Interactive Mode")
        print("Type 'quit' to exit")
        print("-" * 50)
        
        while True:
            try:
                query = input("\nEnter your query: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    break
                
                if query:
                    result = agent.process_query(query)
                    print(f"\nResponse (confidence: {result['confidence']:.1f}%):")
                    print(result['response'])
                    
                    if result['sources']:
                        print(f"\nSources: {', '.join(result['sources'])}")
                        
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}")
        
        print("\nGoodbye!")
        
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 