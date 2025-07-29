#!/usr/bin/env python3
"""
Sourcing Agent Implementation
Specialized agent for cannabis sourcing and supply chain management
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class SourcingAgent(BaseAgent):
    """Specialized agent for cannabis sourcing"""
    
    def __init__(self):
        super().__init__(
            agent_type="sourcing",
            domain="Cannabis Sourcing & Supply Chain",
            description="AI agent specialized in cannabis supply chain management, vendor sourcing, and procurement optimization",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for sourcing specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Sourcing AI agent with expertise in:
        
        - Cannabis supply chain management and optimization
        - Vendor evaluation and supplier relationship management
        - Procurement strategies and contract negotiation
        - Quality assurance for sourced materials
        - Regulatory compliance in sourcing and transport
        - Cost analysis and pricing optimization
        - Inventory planning and demand forecasting
        - Risk management in supply chains
        - Sustainable and ethical sourcing practices
        - Market intelligence and supplier discovery
        
        Provide expert sourcing guidance focused on quality, compliance, cost-effectiveness, and reliability.
        Always consider regulatory requirements and industry best practices.
        """


def run_sourcing_agent():
    """Run the sourcing agent"""
    agent = SourcingAgent()
    
    print(f"🚚 {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5005)
    print(f"\n🌐 Agent server starting on http://localhost:5005")
    app.run(host='0.0.0.0', port=5005, debug=True)


if __name__ == "__main__":
    run_sourcing_agent()