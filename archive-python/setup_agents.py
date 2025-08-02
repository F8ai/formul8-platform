#!/usr/bin/env python3
"""
Setup Script for Formul8 Agent Architecture
Demonstrates the unified base-agent submodule system
"""

import os
import sys
import subprocess
import json
from pathlib import Path


def setup_agent_architecture():
    """Setup the complete agent architecture with base-agent submodules"""
    
    print("🚀 Setting up Formul8 Agent Architecture with Base-Agent Submodules")
    print("=" * 70)
    
    # Define all agents
    agents = [
        "compliance", "formulation", "marketing", "operations", 
        "science", "sourcing", "patent", "spectra", 
        "customer-success", "lms", "metabolomics"
    ]
    
    base_agent_path = Path("agents/base-agent")
    
    # Verify base-agent exists
    if not base_agent_path.exists():
        print("❌ Base-agent directory not found. Please ensure agents/base-agent exists.")
        return False
    
    print(f"✅ Base-agent found at: {base_agent_path}")
    print(f"📦 Setting up {len(agents)} specialized agents...")
    print()
    
    success_count = 0
    
    for agent in agents:
        agent_path = Path(f"agents/{agent}-agent")
        print(f"🔧 Setting up {agent}-agent...")
        
        try:
            # Create agent directory structure
            agent_path.mkdir(exist_ok=True)
            (agent_path / "data" / "results").mkdir(parents=True, exist_ok=True)
            
            # Copy base-agent as submodule simulation
            base_agent_copy = agent_path / "base-agent"
            if not base_agent_copy.exists():
                subprocess.run([
                    "cp", "-r", str(base_agent_path), str(base_agent_copy)
                ], check=True, capture_output=True)
            
            # Verify structure
            required_files = [
                "base-agent/core/agent.py",
                "base-agent/core/testing.py", 
                "base-agent/server/app.py",
                "data/results"
            ]
            
            all_present = True
            for req_file in required_files:
                if not (agent_path / req_file).exists():
                    print(f"   ⚠️  Missing: {req_file}")
                    all_present = False
            
            if all_present:
                print(f"   ✅ {agent}-agent setup complete")
                success_count += 1
            else:
                print(f"   ❌ {agent}-agent setup incomplete")
                
        except Exception as e:
            print(f"   ❌ Error setting up {agent}-agent: {e}")
    
    print()
    print(f"📊 Setup Summary: {success_count}/{len(agents)} agents configured successfully")
    
    # Display architecture overview
    print()
    print("🏗️  Agent Architecture Overview:")
    print("=" * 50)
    
    for agent in agents:
        agent_path = Path(f"agents/{agent}-agent")
        if agent_path.exists():
            baseline_file = agent_path / "baseline.json"
            baseline_count = "N/A"
            
            if baseline_file.exists():
                try:
                    with open(baseline_file) as f:
                        data = json.load(f)
                        if isinstance(data, dict) and 'questions' in data:
                            baseline_count = len(data['questions'])
                        elif isinstance(data, list):
                            baseline_count = len(data)
                except:
                    pass
            
            has_base_agent = (agent_path / "base-agent").exists()
            has_results_dir = (agent_path / "data" / "results").exists()
            
            status = "✅" if has_base_agent and has_results_dir else "⚠️"
            print(f"{status} {agent}-agent | Baseline: {baseline_count} | Base-agent: {has_base_agent}")
    
    print()
    print("🔗 Base-Agent Submodule Benefits:")
    print("  • Standardized multi-model AI testing across all agents")
    print("  • Unified baseline testing framework with real API calls")
    print("  • Consistent result storage (PostgreSQL + JSON backup)")
    print("  • Shared web dashboard and API endpoints")
    print("  • Enforced 'no mock data' policy across all agents")
    print("  • Simplified agent development and maintenance")
    
    return success_count == len(agents)


def verify_compliance_agent():
    """Verify compliance agent has real test results"""
    compliance_results = Path("agents/compliance-agent/data/results")
    
    if compliance_results.exists():
        result_files = list(compliance_results.glob("*.json"))
        print(f"\n🧪 Compliance Agent Test Results: {len(result_files)} files found")
        
        for result_file in result_files[:3]:  # Show first 3
            try:
                with open(result_file) as f:
                    data = json.load(f)
                    if 'testRun' in data:
                        run = data['testRun']
                        print(f"   📄 {result_file.name}: {run.get('model', 'Unknown')} | "
                              f"Accuracy: {run.get('avgAccuracy', 0):.1f}% | "
                              f"Cost: ${run.get('totalCost', 0):.4f}")
            except:
                print(f"   ⚠️  {result_file.name}: Invalid format")
        
        if len(result_files) > 3:
            print(f"   ... and {len(result_files) - 3} more result files")
    else:
        print("\n⚠️  No compliance agent results found")


if __name__ == "__main__":
    print("Formul8 Platform - Agent Architecture Setup")
    print("==========================================")
    print()
    
    # Setup agent architecture
    success = setup_agent_architecture()
    
    # Verify compliance agent results
    verify_compliance_agent()
    
    print()
    if success:
        print("🎉 Agent architecture setup completed successfully!")
        print("🌐 Each agent can now run independently with unified base-agent functionality")
        print()
        print("Next steps:")
        print("1. Run individual agents: python agents/{agent}-agent/agent_implementation.py")
        print("2. Test baseline functionality: Access agent dashboards on ports 5001-5010")
        print("3. Verify API endpoints: GET /api/status, /api/metrics, etc.")
    else:
        print("❌ Setup completed with some issues. Check the output above for details.")
    
    sys.exit(0 if success else 1)