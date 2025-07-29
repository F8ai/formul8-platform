#!/usr/bin/env python3
"""
Example RAG Usage Script
Demonstrates how to use the RAG functionality with the base agent
"""

import os
import sys
import yaml
from typing import Dict, Any

# Add the base_agent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.agent import BaseAgent

def load_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from YAML file"""
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading config from {config_path}: {e}")
        return {}

def main():
    """Example usage of RAG functionality"""
    
    # Load configuration
    config = load_config("agent_config.yaml")
    if not config:
        print("Failed to load configuration")
        return
    
    # Initialize base agent
    agent = BaseAgent(
        agent_name="Cannabis Compliance Agent",
        description="Specialized in cannabis compliance monitoring and regulation analysis",
        domain="Cannabis Compliance",
        config=config
    )
    
    print("=== Cannabis Compliance Agent with RAG ===\n")
    
    # Example 1: Search for specific regulations
    print("1. Searching for cannabis licensing requirements in California...")
    results = agent.search_regulations(
        "cannabis licensing requirements", 
        state="CA", 
        limit=3
    )
    
    if results:
        print(f"Found {len(results)} relevant regulation chunks:")
        for i, result in enumerate(results, 1):
            print(f"\n  Result {i}:")
            print(f"    Content: {result['content'][:200]}...")
            print(f"    State: {result['state']}")
            print(f"    Source: {result['source_url']}")
            print(f"    Similarity Score: {result['similarity_score']:.3f}")
    else:
        print("No results found. Make sure regulations are processed first.")
    
    print("\n" + "="*50 + "\n")
    
    # Example 2: Get all regulations for a state
    print("2. Getting all regulations for California...")
    ca_regulations = agent.get_regulations_by_state("CA", limit=5)
    
    if ca_regulations:
        print(f"Found {len(ca_regulations)} regulation chunks for California:")
        for i, reg in enumerate(ca_regulations, 1):
            print(f"\n  Regulation {i}:")
            print(f"    Content: {reg['content'][:150]}...")
            print(f"    Source: {reg['source_url']}")
    else:
        print("No regulations found for California.")
    
    print("\n" + "="*50 + "\n")
    
    # Example 3: Get RAG system statistics
    print("3. RAG System Statistics:")
    stats = agent.get_rag_stats()
    for key, value in stats.items():
        print(f"    {key}: {value}")
    
    print("\n" + "="*50 + "\n")
    
    # Example 4: Process regulations for a new state
    print("4. Processing regulations for a new state...")
    print("Note: This would process and store regulations in AstraDB")
    print("Example command: python process_regulations.py --state NY --regulations-dir ../regulations")
    
    print("\n" + "="*50 + "\n")
    
    # Example 5: Complex compliance query
    print("5. Complex compliance query example...")
    complex_query = """
    What are the requirements for cannabis dispensary licensing in California, 
    including background checks, security measures, and zoning restrictions?
    """
    
    print(f"Query: {complex_query.strip()}")
    complex_results = agent.search_regulations(complex_query, state="CA", limit=5)
    
    if complex_results:
        print(f"\nFound {len(complex_results)} relevant regulation chunks:")
        for i, result in enumerate(complex_results, 1):
            print(f"\n  Result {i} (Score: {result['similarity_score']:.3f}):")
            print(f"    {result['content'][:300]}...")
    else:
        print("No results found for complex query.")
    
    print("\n=== Example Complete ===")
    print("\nTo process regulations, run:")
    print("  python process_regulations.py --help")

if __name__ == "__main__":
    main() 