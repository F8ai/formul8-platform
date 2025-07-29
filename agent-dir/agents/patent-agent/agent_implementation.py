#!/usr/bin/env python3
"""
Patent Agent Implementation
Specialized agent for cannabis intellectual property and patent analysis
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class PatentAgent(BaseAgent):
    """Specialized agent for cannabis patents and IP"""
    
    def __init__(self):
        super().__init__(
            agent_type="patent",
            domain="Cannabis Patents & Intellectual Property",
            description="AI agent specialized in cannabis patent analysis, IP strategy, and freedom-to-operate assessments",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for patent specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Patent AI agent with expertise in:
        
        - Cannabis patent landscape analysis
        - Freedom-to-operate (FTO) assessments
        - Patent prosecution and application strategies
        - Intellectual property portfolio management
        - Prior art searches and patent validity analysis
        - Cannabis strain and genetics IP protection
        - Extraction method and formulation patents
        - Trademark and brand protection in cannabis
        - IP licensing and technology transfer
        - Patent litigation and enforcement strategies
        
        Provide expert IP guidance while noting that patent law is complex and recommendations should be verified with qualified patent attorneys.
        Always consider the evolving nature of cannabis patent law and regulatory changes.
        """


def run_patent_agent():
    """Run the patent agent"""
    agent = PatentAgent()
    
    print(f"⚖️ {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5006)
    print(f"\n🌐 Agent server starting on http://localhost:5006")
    app.run(host='0.0.0.0', port=5006, debug=True)


if __name__ == "__main__":
    run_patent_agent()