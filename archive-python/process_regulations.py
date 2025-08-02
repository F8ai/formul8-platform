#!/usr/bin/env python3
"""
Regulation Processing Script
Processes regulation files and stores them in AstraDB for RAG functionality
"""

import os
import sys
import yaml
import argparse
from typing import List, Dict, Any
from pathlib import Path

# Add the base_agent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.agent import BaseAgent
from core.rag import AstraDBRAG, RegulationProcessor

def load_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from YAML file"""
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading config from {config_path}: {e}")
        return {}

def get_state_directories(regulations_dir: str) -> List[str]:
    """Get list of state directories from regulations directory"""
    state_dirs = []
    if os.path.exists(regulations_dir):
        for item in os.listdir(regulations_dir):
            item_path = os.path.join(regulations_dir, item)
            if os.path.isdir(item_path) and len(item) == 2:  # State codes are 2 letters
                state_dirs.append(item)
    return sorted(state_dirs)

def process_single_state(rag_system: AstraDBRAG, processor: RegulationProcessor, 
                        state: str, regulations_dir: str, force: bool = False) -> bool:
    """Process regulations for a single state"""
    print(f"\nProcessing regulations for state: {state}")
    
    state_dir = os.path.join(regulations_dir, state)
    if not os.path.exists(state_dir):
        print(f"State directory not found: {state_dir}")
        return False
    
    # Check if state already has regulations (if not forcing)
    if not force:
        existing_regs = rag_system.get_regulations_by_state(state, limit=1)
        if existing_regs:
            print(f"State {state} already has regulations. Use --force to reprocess.")
            return True
    
    # Process the state
    success = processor.process_state_regulations(state, regulations_dir)
    if success:
        print(f"Successfully processed regulations for {state}")
    else:
        print(f"Failed to process regulations for {state}")
    
    return success

def main():
    parser = argparse.ArgumentParser(description="Process regulation files and store in AstraDB")
    parser.add_argument("--config", default="agent_config.yaml", 
                       help="Path to agent configuration file")
    parser.add_argument("--regulations-dir", default="../regulations", 
                       help="Path to regulations directory")
    parser.add_argument("--state", help="Process only specific state (e.g., CA, NY)")
    parser.add_argument("--force", action="store_true", 
                       help="Force reprocessing even if regulations exist")
    parser.add_argument("--list-states", action="store_true", 
                       help="List available states and exit")
    parser.add_argument("--stats", action="store_true", 
                       help="Show RAG system statistics")
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    if not config:
        print("Failed to load configuration")
        return 1
    
    # Check if AstraDB is configured
    if not config.get("astra_db"):
        print("AstraDB configuration not found in config file")
        return 1
    
    # Initialize RAG system
    try:
        rag_system = AstraDBRAG(config)
        processor = RegulationProcessor(rag_system)
        print("Successfully initialized RAG system")
    except Exception as e:
        print(f"Failed to initialize RAG system: {e}")
        return 1
    
    # Show statistics if requested
    if args.stats:
        stats = rag_system.get_collection_stats()
        print("\nRAG System Statistics:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
        return 0
    
    # List states if requested
    if args.list_states:
        states = get_state_directories(args.regulations_dir)
        print(f"\nAvailable states in {args.regulations_dir}:")
        for state in states:
            reg_count = len(rag_system.get_regulations_by_state(state, limit=1000))
            print(f"  {state}: {reg_count} regulation chunks")
        return 0
    
    # Process regulations
    if args.state:
        # Process single state
        success = process_single_state(rag_system, processor, args.state, 
                                     args.regulations_dir, args.force)
        return 0 if success else 1
    else:
        # Process all states
        states = get_state_directories(args.regulations_dir)
        if not states:
            print(f"No state directories found in {args.regulations_dir}")
            return 1
        
        print(f"Processing regulations for {len(states)} states...")
        
        successful_states = []
        failed_states = []
        
        for state in states:
            success = process_single_state(rag_system, processor, state, 
                                         args.regulations_dir, args.force)
            if success:
                successful_states.append(state)
            else:
                failed_states.append(state)
        
        # Summary
        print(f"\nProcessing complete!")
        print(f"Successful: {len(successful_states)} states")
        print(f"Failed: {len(failed_states)} states")
        
        if successful_states:
            print(f"Successful states: {', '.join(successful_states)}")
        if failed_states:
            print(f"Failed states: {', '.join(failed_states)}")
            return 1
        
        return 0

if __name__ == "__main__":
    sys.exit(main()) 