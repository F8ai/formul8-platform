#!/usr/bin/env python3
"""
Formulation Agent Implementation
Specialized agent for cannabis formulation and molecular analysis
"""

import sys
import os

# Add base-agent to path
base_agent_path = os.path.join(os.path.dirname(__file__), 'base-agent')
sys.path.insert(0, base_agent_path)

try:
    from core.agent import BaseAgent
    from core.testing import BaselineTestRunner  
    from server.app import create_agent_server
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Base agent path: {base_agent_path}")
    print(f"Contents: {os.listdir(base_agent_path) if os.path.exists(base_agent_path) else 'Path not found'}")
    sys.exit(1)


class FormulationAgent(BaseAgent):
    """Specialized agent for cannabis formulation"""
    
    def __init__(self):
        super().__init__(
            agent_type="formulation",
            domain="Cannabis Formulation & Molecular Analysis",
            description="AI agent specialized in cannabis product formulation, molecular analysis, and RDKit chemistry",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for formulation specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Formulation AI agent with expertise in:
        
        - Molecular analysis and chemistry using RDKit
        - Cannabis product formulation (tinctures, edibles, topicals)
        - Terpene profiles and effect synergies
        - Quality control and testing protocols
        - Regulatory compliance for formulated products
        - Ingredient interactions and stability analysis
        - Dosing calculations and bioavailability
        
        Provide expert-level guidance with scientific backing and cite relevant research when available.
        Always consider safety, compliance, and quality in your recommendations.
        """


def run_formulation_agent():
    """Run the formulation agent"""
    agent = FormulationAgent()
    
    print(f"🧪 {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5001)
    print(f"\n🌐 Agent server starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)


if __name__ == "__main__":
    run_formulation_agent()