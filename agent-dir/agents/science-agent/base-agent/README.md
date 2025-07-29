# Base Agent Module

This is the core base agent module used by all specialized Formul8 agents. It provides:

## Core Features
- Standardized agent architecture with LangChain integration
- Multi-model AI testing infrastructure (OpenAI, Anthropic, Google)
- Baseline testing framework with authentic API responses
- Cost tracking and performance metrics
- Result storage in both PostgreSQL and JSON files
- Web server with dashboard and API endpoints

## Architecture
```
base-agent/
├── core/
│   ├── agent.py          # Base agent class with LangChain integration
│   ├── testing.py        # Baseline testing framework
│   ├── storage.py        # Result storage (DB + JSON)
│   └── __init__.py
├── server/
│   ├── app.py           # Flask web server
│   ├── routes.py        # API endpoints
│   └── __init__.py
├── templates/
│   └── dashboard.html   # Agent dashboard template
├── data/
│   └── results/         # JSON result storage
├── requirements.txt     # Dependencies
└── README.md           # This file
```

## Usage as Submodule

Each specialized agent includes this as a submodule:

```bash
# Add base-agent as submodule
git submodule add https://github.com/F8ai/base-agent.git agents/{agent-name}/base-agent

# Initialize and update
git submodule update --init --recursive
```

## Agent Integration

Specialized agents inherit from the base agent:

```python
from base_agent.core.agent import BaseAgent
from base_agent.core.testing import BaselineTestRunner

class ComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="compliance",
            domain="Cannabis Compliance",
            description="AI agent for cannabis regulatory compliance"
        )
```

## Baseline Testing

All agents use the same baseline testing infrastructure:

```python
# Run baseline tests with real API calls
runner = BaselineTestRunner(agent=self)
results = await runner.run_tests(state="CO", model="gpt-4o")

# Results stored in:
# - PostgreSQL database (for queries)
# - JSON files (for backup/direct access)
```

## Real Data Only Policy

The base agent enforces the "no mock data" policy:
- All test results use real API responses
- Costs calculated from actual token usage
- Performance metrics from real response times
- Clear labeling when data is unavailable