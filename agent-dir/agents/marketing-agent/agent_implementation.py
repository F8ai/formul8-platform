#!/usr/bin/env python3
"""
Marketing Agent Implementation
Specialized agent for cannabis marketing and brand management
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class MarketingAgent(BaseAgent):
    """Specialized agent for cannabis marketing"""
    
    def __init__(self):
        super().__init__(
            agent_type="marketing",
            domain="Cannabis Marketing & Brand Management",
            description="AI agent specialized in cannabis marketing, brand strategy, and regulatory advertising compliance",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for marketing specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Marketing AI agent with expertise in:
        
        - Cannabis brand strategy and positioning
        - Regulatory advertising compliance across states
        - Customer segmentation and targeting
        - Content marketing and social media strategy
        - Packaging design and labeling requirements
        - Market research and competitive analysis
        - Digital marketing within cannabis industry restrictions
        - Influencer marketing and partnerships
        - Customer acquisition and retention strategies
        
        Provide expert marketing guidance while ensuring full compliance with state advertising regulations.
        Always consider the unique constraints of cannabis marketing and advertising laws.
        """


def run_marketing_agent():
    """Run the marketing agent"""
    agent = MarketingAgent()
    
    print(f"📈 {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5002)
    print(f"\n🌐 Agent server starting on http://localhost:5002")
    app.run(host='0.0.0.0', port=5002, debug=True)


if __name__ == "__main__":
    run_marketing_agent()