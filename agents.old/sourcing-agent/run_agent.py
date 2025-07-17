#!/usr/bin/env python3
"""
Standalone runner for Sourcing Agent
Usage: python run_agent.py [--test] [--query "your question"] [--interactive]
"""

import asyncio
import argparse
import sys
import json
from agent import create_sourcing_agent

async def main():
    parser = argparse.ArgumentParser(description='Sourcing Agent - Cannabis Supply Chain')
    parser.add_argument('--test', action='store_true', help='Run baseline tests')
    parser.add_argument('--query', type=str, help='Ask a specific question')
    parser.add_argument('--interactive', action='store_true', help='Start interactive session')
    
    args = parser.parse_args()
    
    # Initialize agent
    print("🚀 Initializing Sourcing Agent...")
    agent = create_sourcing_agent()
    
    if args.test:
        print("🧪 Running baseline tests...")
        results = await agent.run_baseline_test()
        print(f"✅ Test Results: {results['passed']}/{results['total_questions']} passed")
        print(f"📊 Average Confidence: {results['average_confidence']:.2f}")
        
        if results['passed'] < results['total_questions']:
            print("\n❌ Failed tests:")
            for result in results['results']:
                if not result.get('passed', False):
                    print(f"  - {result.get('question_id', 'Unknown')}: {result.get('question', 'No question')}")
    
    elif args.query:
        print(f"❓ Processing query: {args.query}")
        result = await agent.process_query("cli_user", args.query)
        print(f"💬 Response: {result['response']}")
        print(f"📊 Confidence: {result['confidence']:.2f}")
    
    elif args.interactive:
        print("🎮 Starting interactive session...")
        print("Type 'exit' to quit, 'help' for commands")
        
        while True:
            try:
                user_input = input("\n👤 You: ").strip()
                
                if user_input.lower() == 'exit':
                    print("👋 Goodbye!")
                    break
                elif user_input.lower() == 'help':
                    print("Available commands:")
                    print("  help - Show this help")
                    print("  exit - Exit the session")
                    print("  clear - Clear conversation history")
                    print("  history - Show conversation history")
                    continue
                elif user_input.lower() == 'clear':
                    agent.clear_user_memory("interactive_user")
                    print("🧹 Conversation history cleared")
                    continue
                elif user_input.lower() == 'history':
                    history = agent.get_user_conversation_history("interactive_user")
                    print("📜 Conversation history:")
                    for msg in history[-5:]:  # Show last 5 messages
                        print(f"  {msg['type']}: {msg['content'][:100]}...")
                    continue
                
                if not user_input:
                    continue
                
                result = await agent.process_query("interactive_user", user_input)
                print(f"🤖 Agent: {result['response']}")
                print(f"📊 (Confidence: {result['confidence']:.2f})")
                
            except KeyboardInterrupt:
                print("\n👋 Session interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    else:
        print("🤖 Sourcing Agent Ready!")
        print("Usage:")
        print("  python run_agent.py --test                    # Run baseline tests")
        print("  python run_agent.py --query 'your question'   # Ask a question")
        print("  python run_agent.py --interactive             # Interactive session")

if __name__ == "__main__":
    asyncio.run(main())