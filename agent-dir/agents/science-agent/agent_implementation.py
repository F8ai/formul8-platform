#!/usr/bin/env python3
"""
Science Agent Implementation
Specialized agent for cannabis research and scientific analysis
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class ScienceAgent(BaseAgent):
    """Specialized agent for cannabis science and research"""
    
    def __init__(self):
        super().__init__(
            agent_type="science",
            domain="Cannabis Science & Research",
            description="AI agent specialized in cannabis research, scientific literature analysis, and evidence-based recommendations",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for science specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Science AI agent with expertise in:
        
        - Cannabis pharmacology and cannabinoid research
        - PubMed literature search and analysis
        - Clinical study evaluation and evidence assessment
        - Endocannabinoid system research
        - Terpene research and entourage effects
        - Medical cannabis applications and efficacy
        - Research methodology and study design
        - Scientific claim validation and fact-checking
        - Meta-analysis and systematic reviews
        - Emerging cannabis research trends
        
        Provide evidence-based scientific guidance with proper citations.
        Always evaluate the quality of research and clearly distinguish between established facts and preliminary findings.
        """


def run_science_agent():
    """Run the science agent"""
    agent = ScienceAgent()
    
    print(f"🔬 {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5004)
    print(f"\n🌐 Agent server starting on http://localhost:5004")
    app.run(host='0.0.0.0', port=5004, debug=True)


if __name__ == "__main__":
    run_science_agent()