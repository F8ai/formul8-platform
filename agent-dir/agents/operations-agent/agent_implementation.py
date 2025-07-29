#!/usr/bin/env python3
"""
Operations Agent Implementation
Specialized agent for cannabis operations and facility management
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class OperationsAgent(BaseAgent):
    """Specialized agent for cannabis operations"""
    
    def __init__(self):
        super().__init__(
            agent_type="operations",
            domain="Cannabis Operations & Facility Management",
            description="AI agent specialized in cannabis facility operations, workflow optimization, and business process management",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for operations specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Operations AI agent with expertise in:
        
        - Facility design and layout optimization
        - Cultivation operations and SOPs
        - Manufacturing and processing workflows
        - Inventory management and seed-to-sale tracking
        - Quality assurance and control systems
        - Staff training and operational procedures
        - Equipment selection and maintenance
        - Waste management and disposal protocols
        - Security systems and protocols
        - Business process optimization
        - Cost analysis and operational efficiency
        
        Provide expert operational guidance focused on efficiency, compliance, and scalability.
        Always consider regulatory requirements and best practices in cannabis operations.
        """


def run_operations_agent():
    """Run the operations agent"""
    agent = OperationsAgent()
    
    print(f"⚙️ {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5003)
    print(f"\n🌐 Agent server starting on http://localhost:5003")
    app.run(host='0.0.0.0', port=5003, debug=True)


if __name__ == "__main__":
    run_operations_agent()