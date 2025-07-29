"""
ComplianceAgent with LangChain, RAG, and Memory Support
Inherits from base-agent for shared functionality
"""

import os
import sys
from typing import Dict, List, Any
from datetime import datetime

# Add the base_agent module to Python path
current_dir = os.path.dirname(__file__)
base_agent_path = os.path.join(current_dir, "base_agent")
sys.path.insert(0, str(base_agent_path))

try:
    from core.agent import BaseAgent
except ImportError:
    # Fallback for when base_agent isn't properly set up
    print("Warning: base_agent module not found. Creating minimal BaseAgent.")

    class BaseAgent:
        def __init__(self, agent_name: str, description: str = "", domain: str = "", agent_path: str = "."):
            self.agent_name = agent_name
            self.description = description
            self.domain = domain
            self.agent_path = agent_path
            self.tools = []

        async def process_query(self, user_id: str, query: str) -> Dict[str, Any]:
            return {
                "response": f"Mock response for: {query}",
                "confidence": 0.62,
                "response_time": 1.0
            }

from langchain.tools import Tool

class ComplianceAgent(BaseAgent):
    """
    Cannabis regulatory compliance and legal guidance
    Specializes in Cannabis Regulatory Compliance
    """

    def __init__(self, agent_path: str = "."):
        # Load agent-specific config
        config_path = os.path.join(agent_path, "agent_config.yaml")
        self.config = load_config(config_path)

        # Initialize base agent with config
        super().__init__(
            agent_name=self.config.agent.name,
            description=self.config.agent.description,
            domain=self.config.agent.domain,
            agent_path=agent_path
        )

        # Add compliance-specific tools
        self._add_compliance_tools()

    def _add_compliance_tools(self):
        """Add compliance-specific tools to the base agent"""
        compliance_tools = [
            self._create_regulatory_search_tool(),
            self._create_compliance_check_tool(),
            self._create_state_requirements_tool()
        ]

        # Add tools to base agent's tool list
        self.tools.extend(compliance_tools)

        # Reinitialize agent with new tools
        self._initialize_agent()

    def _create_regulatory_search_tool(self):
        """Create regulatory search tool"""
        def regulatory_search(query: str) -> str:
            # Use base agent's RAG functionality with compliance-specific context
            if self.retriever:
                try:
                    docs = self.retriever.get_relevant_documents(f"cannabis regulation {query}")
                    context = "\n\n".join([doc.page_content for doc in docs])
                    return f"Regulatory guidance: {context}"
                except Exception as e:
                    return f"Error searching regulations: {str(e)}"
            return "Regulatory search requires knowledge base setup"

        return Tool(
            name="regulatory_search",
            description="Search cannabis regulatory database for compliance requirements",
            func=regulatory_search
        )

    def _create_compliance_check_tool(self):
        """Create compliance check tool"""
        def compliance_check(query: str) -> str:
            return f"Compliance analysis for: {query}\n" \
                   f"Status: Review required\n" \
                   f"Recommendations: Consult current state regulations"

        return Tool(
            name="compliance_check",
            description="Perform compliance verification for cannabis operations",
            func=compliance_check
        )

    def _create_state_requirements_tool(self):
        """Create state requirements tool"""
        def state_requirements(query: str) -> str:
            return f"State requirements analysis for: {query}\n" \
                   f"Jurisdiction: Multiple states applicable\n" \
                   f"Key requirements: Licensing, testing, tracking, security"

        return Tool(
            name="state_requirements",
            description="Analyze state-specific cannabis regulatory requirements",
            func=state_requirements
        )

    def get_system_prompt(self) -> str:
        """Override base system prompt with compliance-specific context"""
        return f"""You are a specialized AI agent for {self.config.agent.description}.

Domain Expertise: {self.config.agent.domain}

You provide expert guidance on:
- Cannabis regulatory compliance
- State and federal cannabis laws
- Licensing requirements
- Testing and quality standards
- Security and tracking requirements
- Business compliance strategies

Always:
- Cite relevant regulations and sources
- Provide jurisdiction-specific guidance
- Include compliance confidence scores
- Recommend consulting legal professionals for complex matters

Available tools: {[tool.name for tool in self.tools]}
"""

def create_compliance_agent(agent_path: str = ".") -> ComplianceAgent:
    """Create and return a configured compliance agent"""
    return ComplianceAgent(agent_path)

if __name__ == "__main__":
    import asyncio

    async def main():
        agent = create_compliance_agent()
        result = await agent.process_query(
            user_id="test_user",
            query="What are the key cannabis regulatory compliance requirements for Colorado?"
        )
        print(f"Response: {result['response']}")
        print(f"Confidence: {result['confidence']}")

    asyncio.run(main())
`