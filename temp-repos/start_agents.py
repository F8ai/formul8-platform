#!/usr/bin/env python3
"""
Formul8 Agents Startup Script

This script starts multiple agents with their correct port configurations.
"""

import os
import sys
import subprocess
import time
import signal
from typing import List, Dict
import argparse

# Add base-agent shared directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'base-agent', 'shared'))
from port_config import PORTS, COMPONENT_DESCRIPTIONS

class AgentManager:
    """Manages starting and stopping of Formul8 agents."""
    
    def __init__(self):
        self.processes = {}
        self.agent_paths = {
            'base_agent': 'base-agent',
            'metabolomics_agent': 'metabolomics-agent',
            'compliance_agent': 'compliance-agent',
            'formulation_agent': 'formulation-agent',
            'marketing_agent': 'marketing-agent',
            'operations_agent': 'operations-agent',
            'patent_agent': 'patent-agent',
            'science_agent': 'science-agent',
            'sourcing_agent': 'sourcing-agent',
            'spectra_agent': 'spectra-agent',
            'lms_agent': 'lms-agent'
        }
    
    def start_agent(self, agent_name: str) -> bool:
        """Start a specific agent."""
        if agent_name not in PORTS:
            print(f"❌ Unknown agent: {agent_name}")
            return False
        
        if agent_name not in self.agent_paths:
            print(f"❌ No path configured for agent: {agent_name}")
            return False
        
        port = PORTS[agent_name]
        agent_path = self.agent_paths[agent_name]
        description = COMPONENT_DESCRIPTIONS.get(agent_name, 'Unknown')
        
        print(f"Starting {agent_name} (port {port}) - {description}")
        
        try:
            # Set environment variable for port
            env = os.environ.copy()
            env[f"{agent_name.upper()}_PORT"] = str(port)
            
            # Determine the main script to run
            if agent_name == 'base_agent':
                script_path = os.path.join(agent_path, 'base_agent.py')
            else:
                script_path = os.path.join(agent_path, 'agent.py')
            
            if not os.path.exists(script_path):
                print(f"❌ Script not found: {script_path}")
                return False
            
            # Start the process
            process = subprocess.Popen(
                [sys.executable, script_path],
                cwd=agent_path,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[agent_name] = {
                'process': process,
                'port': port,
                'path': agent_path,
                'description': description
            }
            
            print(f"✅ Started {agent_name} (PID: {process.pid})")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start {agent_name}: {e}")
            return False
    
    def start_multiple_agents(self, agent_names: List[str]) -> Dict[str, bool]:
        """Start multiple agents."""
        results = {}
        
        print(f"Starting {len(agent_names)} agents...")
        print("=" * 60)
        
        for agent_name in agent_names:
            results[agent_name] = self.start_agent(agent_name)
            time.sleep(1)  # Small delay between starts
        
        return results
    
    def start_all_agents(self) -> Dict[str, bool]:
        """Start all available agents."""
        agent_names = [name for name in PORTS.keys() if 'agent' in name]
        return self.start_multiple_agents(agent_names)
    
    def stop_agent(self, agent_name: str) -> bool:
        """Stop a specific agent."""
        if agent_name not in self.processes:
            print(f"❌ Agent {agent_name} not running")
            return False
        
        process_info = self.processes[agent_name]
        process = process_info['process']
        
        try:
            process.terminate()
            process.wait(timeout=5)
            del self.processes[agent_name]
            print(f"✅ Stopped {agent_name}")
            return True
        except subprocess.TimeoutExpired:
            process.kill()
            del self.processes[agent_name]
            print(f"⚠️  Force killed {agent_name}")
            return True
        except Exception as e:
            print(f"❌ Error stopping {agent_name}: {e}")
            return False
    
    def stop_all_agents(self):
        """Stop all running agents."""
        print("Stopping all agents...")
        
        for agent_name in list(self.processes.keys()):
            self.stop_agent(agent_name)
    
    def list_running_agents(self):
        """List all running agents."""
        if not self.processes:
            print("No agents are running")
            return
        
        print("Running agents:")
        print("-" * 60)
        
        for agent_name, info in self.processes.items():
            process = info['process']
            status = "Running" if process.poll() is None else "Stopped"
            print(f"{agent_name:20} | Port {info['port']:4} | {status:8} | PID {process.pid:6}")
    
    def wait_for_agents(self, timeout: int = 30):
        """Wait for agents to start up."""
        print(f"Waiting up to {timeout} seconds for agents to start...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            all_running = True
            for agent_name, info in self.processes.items():
                if info['process'].poll() is not None:
                    all_running = False
                    break
            
            if all_running:
                print("✅ All agents are running!")
                return True
            
            time.sleep(1)
        
        print("⚠️  Some agents may not have started properly")
        return False

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Start Formul8 agents')
    parser.add_argument('--agents', nargs='+', help='Specific agents to start')
    parser.add_argument('--all', action='store_true', help='Start all agents')
    parser.add_argument('--list', action='store_true', help='List available agents')
    parser.add_argument('--stop', action='store_true', help='Stop all running agents')
    parser.add_argument('--status', action='store_true', help='Show status of running agents')
    
    args = parser.parse_args()
    
    manager = AgentManager()
    
    # Handle signal for graceful shutdown
    def signal_handler(sig, frame):
        print("\nShutting down agents...")
        manager.stop_all_agents()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if args.list:
        print("Available agents:")
        print("-" * 60)
        for agent_name, port in PORTS.items():
            if 'agent' in agent_name:
                description = COMPONENT_DESCRIPTIONS.get(agent_name, 'Unknown')
                print(f"{agent_name:20} | Port {port:4} | {description}")
        return
    
    if args.status:
        manager.list_running_agents()
        return
    
    if args.stop:
        manager.stop_all_agents()
        return
    
    if args.all:
        results = manager.start_all_agents()
    elif args.agents:
        results = manager.start_multiple_agents(args.agents)
    else:
        print("Please specify --agents <list> or --all")
        return
    
    # Show results
    print("\n" + "=" * 60)
    print("Startup Results:")
    print("-" * 60)
    
    successful = sum(1 for success in results.values() if success)
    total = len(results)
    
    for agent_name, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        port = PORTS.get(agent_name, 0)
        print(f"{agent_name:20} | Port {port:4} | {status}")
    
    print(f"\nStarted {successful}/{total} agents successfully")
    
    if successful > 0:
        print("\nWaiting for agents to initialize...")
        manager.wait_for_agents()
        
        print("\nAgent Status:")
        manager.list_running_agents()
        
        print("\nPress Ctrl+C to stop all agents")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
            manager.stop_all_agents()

if __name__ == "__main__":
    main() 