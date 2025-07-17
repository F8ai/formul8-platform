#!/usr/bin/env python3
"""
Enhanced Agent Runner - Run individual agents with comprehensive testing
This provides a unified interface for running any of the 9 Formul8 agents
"""

import sys
import os
import json
import subprocess
from pathlib import Path

def create_missing_agent_files():
    """Create missing baseline.json and run_agent.py files for agents"""
    
    agents_needing_files = [
        'customer-success-agent',
        'patent-agent', 
        'spectra-agent',
        'sourcing-agent'
    ]
    
    for agent in agents_needing_files:
        agent_dir = Path(agent)
        if not agent_dir.exists():
            agent_dir.mkdir(exist_ok=True)
            print(f"Created directory: {agent_dir}")
        
        # Create run_agent.py if missing
        run_agent_file = agent_dir / 'run_agent.py'
        if not run_agent_file.exists():
            run_agent_content = f'''#!/usr/bin/env python3
"""
{agent.replace('-', ' ').title()} Agent Runner
"""

import sys
import json
from pathlib import Path

def load_baseline_questions():
    """Load baseline questions for testing"""
    baseline_file = Path(__file__).parent / 'baseline.json'
    if baseline_file.exists():
        with open(baseline_file, 'r') as f:
            return json.load(f)
    return []

def run_baseline_test():
    """Run baseline test questions"""
    questions = load_baseline_questions()
    print(f"Running baseline test with {{len(questions)}} questions...")
    
    for i, q in enumerate(questions, 1):
        print(f"\\nQuestion {{i}}: {{q.get('question', 'No question text')}}")
        print(f"Category: {{q.get('category', 'uncategorized')}}")
        print(f"Difficulty: {{q.get('difficulty', 'unknown')}}")
        print(f"Expected: {{q.get('expected_answer', 'No expected answer')[:100]}}...")

def run_interactive():
    """Run interactive mode"""
    print(f"Interactive mode for {agent.replace('-', ' ').title()} Agent")
    print("Type 'quit' to exit")
    
    while True:
        query = input("\\nEnter your question: ").strip()
        if query.lower() in ['quit', 'exit']:
            break
        print(f"Processing: {{query}}")
        print("(This would connect to the actual agent implementation)")

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        if '--test' in sys.argv:
            run_baseline_test()
        elif '--interactive' in sys.argv:
            run_interactive()
        elif '--query' in sys.argv:
            query_idx = sys.argv.index('--query') + 1
            if query_idx < len(sys.argv):
                query = sys.argv[query_idx]
                print(f"Processing query: {{query}}")
            else:
                print("Please provide a query after --query")
        else:
            print("Usage: python run_agent.py [--test] [--interactive] [--query 'your question']")
    else:
        print("Usage: python run_agent.py [--test] [--interactive] [--query 'your question']")

if __name__ == "__main__":
    main()
'''
            
            with open(run_agent_file, 'w') as f:
                f.write(run_agent_content)
            print(f"Created: {run_agent_file}")
            
        # Make run_agent.py executable
        os.chmod(run_agent_file, 0o755)

def list_agents():
    """List all available agents"""
    agents = [
        'compliance-agent',
        'formulation-agent',
        'marketing-agent', 
        'science-agent',
        'operations-agent',
        'customer-success-agent',
        'patent-agent',
        'spectra-agent',
        'sourcing-agent'
    ]
    
    print("Available Formul8 Agents:")
    print("=" * 40)
    
    for agent in agents:
        agent_dir = Path(agent)
        status = "✓" if agent_dir.exists() else "✗"
        baseline_status = "✓" if (agent_dir / 'baseline.json').exists() else "✗"
        runner_status = "✓" if (agent_dir / 'run_agent.py').exists() else "✗"
        
        print(f"{status} {agent}")
        print(f"   Baseline: {baseline_status} | Runner: {runner_status}")
    
    print(f"\nTotal agents: {len(agents)}")

def run_agent(agent_name, args):
    """Run a specific agent"""
    agent_dir = Path(agent_name)
    
    if not agent_dir.exists():
        print(f"Error: Agent directory '{agent_name}' not found")
        print("Available agents:")
        list_agents()
        return
    
    run_agent_file = agent_dir / 'run_agent.py'
    if not run_agent_file.exists():
        print(f"Error: {run_agent_file} not found")
        return
    
    # Change to agent directory and run
    os.chdir(agent_dir)
    cmd = [sys.executable, 'run_agent.py'] + args
    subprocess.run(cmd)

def test_all_agents():
    """Test all available agents"""
    agents = [
        'compliance-agent',
        'formulation-agent', 
        'marketing-agent',
        'science-agent',
        'operations-agent',
        'customer-success-agent',
        'patent-agent',
        'spectra-agent',
        'sourcing-agent'
    ]
    
    print("Testing all agents...")
    print("=" * 50)
    
    for agent in agents:
        print(f"\n🧪 Testing {agent}...")
        agent_dir = Path(agent)
        
        if not agent_dir.exists():
            print(f"   ❌ Agent directory not found")
            continue
            
        baseline_file = agent_dir / 'baseline.json'
        if baseline_file.exists():
            try:
                with open(baseline_file, 'r') as f:
                    questions = json.load(f)
                print(f"   ✅ Baseline: {len(questions)} questions")
            except Exception as e:
                print(f"   ❌ Baseline error: {e}")
        else:
            print(f"   ❌ No baseline.json found")
            
        run_agent_file = agent_dir / 'run_agent.py'
        if run_agent_file.exists():
            print(f"   ✅ Runner: Available")
        else:
            print(f"   ❌ No run_agent.py found")

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Formul8 Universal Agent Runner")
        print("=" * 40)
        print("Usage:")
        print("  python run_agent.py list                    # List all agents")
        print("  python run_agent.py create                  # Create missing files")
        print("  python run_agent.py test-all                # Test all agents")
        print("  python run_agent.py <agent-name> [options]  # Run specific agent")
        print("")
        print("Agent options:")
        print("  --test                     # Run baseline tests")
        print("  --interactive              # Interactive mode")
        print("  --query 'your question'    # Process single query")
        print("")
        list_agents()
        return
    
    command = sys.argv[1]
    
    if command == 'list':
        list_agents()
    elif command == 'create':
        create_missing_agent_files()
    elif command == 'test-all':
        test_all_agents()
    elif command in ['compliance-agent', 'formulation-agent', 'marketing-agent', 
                     'science-agent', 'operations-agent', 'customer-success-agent',
                     'patent-agent', 'spectra-agent', 'sourcing-agent']:
        run_agent(command, sys.argv[2:])
    else:
        print(f"Unknown command: {command}")
        print("Use 'python run_agent.py' for usage help")

if __name__ == "__main__":
    main()