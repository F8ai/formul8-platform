#!/usr/bin/env python3
"""
Standalone runner for Science Agent
Usage: python run_agent.py [--test] [--query "your question"]
"""

import os
import sys
import asyncio
import argparse
from agent import create_science_agent

async def main():
    parser = argparse.ArgumentParser(description='Run Science Agent')
    parser.add_argument('--test', action='store_true', help='Run baseline tests')
    parser.add_argument('--query', type=str, help='Ask a specific question')
    parser.add_argument('--user-id', type=str, default='cli_user', help='User ID for conversation tracking')
    parser.add_argument('--interactive', action='store_true', help='Start interactive mode')
    
    args = parser.parse_args()
    
    print("🔬 Starting Science Agent...")
    agent = create_science_agent()
    
    if args.test:
        print("\n📊 Running baseline tests...")
        results = await agent.run_baseline_test()
        print(f"Test Results: {results['passed']}/{results['total_questions']} passed")
        print(f"Average Confidence: {results['average_confidence']:.2f}")
        
        for result in results['results']:
            status = "✅ PASS" if result['passed'] else "❌ FAIL"
            print(f"{status} {result['question_id']}: {result.get('confidence', 0):.2f}")
        
        return
    
    if args.query:
        print(f"\n💬 Processing query: {args.query}")
        response = await agent.process_query(args.user_id, args.query)
        print(f"\n🤖 Agent Response:\n{response['response']}")
        print(f"\n📈 Confidence: {response['confidence']:.2f}")
        return
    
    if args.interactive:
        print("\n💬 Interactive mode - type 'quit' to exit")
        print("💡 Try asking about: research evidence, clinical trials, PubMed studies")
        while True:
            try:
                query = input("\nYou: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    break
                if not query:
                    continue
                
                response = await agent.process_query(args.user_id, query)
                print(f"\n🔬 Science Agent: {response['response']}")
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}")
        
        print("\n👋 Goodbye!")
        return
    
    # Default: show help
    parser.print_help()

if __name__ == "__main__":
    asyncio.run(main())