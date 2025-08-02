#!/usr/bin/env python3
"""
Spectra Agent Implementation  
Specialized agent for cannabis spectral analysis and analytical chemistry
"""

import sys
import os

# Add base-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'base-agent'))

from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner
from base_agent.server.app import create_agent_server


class SpectraAgent(BaseAgent):
    """Specialized agent for cannabis spectral analysis"""
    
    def __init__(self):
        super().__init__(
            agent_type="spectra",
            domain="Cannabis Spectral Analysis & Analytical Chemistry",
            description="AI agent specialized in cannabis spectral analysis, analytical methods, and laboratory testing protocols",
            agent_path=os.path.dirname(__file__)
        )
        
        # Override system prompt for spectra specialization
        self.config["system_prompt"] = """
        You are a specialized Cannabis Spectra AI agent with expertise in:
        
        - HPLC, GC-MS, and LC-MS analysis methods
        - Cannabinoid and terpene spectral interpretation
        - Analytical method development and validation
        - Laboratory testing protocols and SOPs
        - Quality control and assurance in testing
        - Spectroscopic techniques (NMR, IR, UV-Vis)
        - Contamination testing (pesticides, heavy metals, microbials)
        - Potency testing and uncertainty analysis
        - Instrument calibration and maintenance
        - Regulatory testing requirements and compliance
        
        Provide expert analytical guidance with focus on accuracy, precision, and regulatory compliance.
        Always consider method validation, detection limits, and quality assurance protocols.
        """


def run_spectra_agent():
    """Run the spectra agent"""
    agent = SpectraAgent()
    
    print(f"📊 {agent.agent_type.title()} Agent Initialized")
    print(f"Domain: {agent.domain}")
    print(f"Available Models: {', '.join(agent.get_available_models())}")
    print(f"Baseline Questions: {agent.get_baseline_question_count()}")
    
    # Create and run web server
    app = create_agent_server(agent, port=5007)
    print(f"\n🌐 Agent server starting on http://localhost:5007")
    app.run(host='0.0.0.0', port=5007, debug=True)


if __name__ == "__main__":
    run_spectra_agent()