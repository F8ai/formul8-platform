# Python AI Agents

This directory contains the specialized Python-based AI agents for the Formul8 Platform:

## Agents
- **Compliance Agent**: Regulatory compliance analysis and tracking
- **Formulation Agent**: Cannabis product formulation and molecular analysis  
- **Science Agent**: Research and scientific analysis
- **Patent Agent**: Patent research and analysis
- **Sourcing Agent**: Supply chain and sourcing optimization

## Architecture
- Python agents run as microservices
- Communicate with Node.js backend via REST APIs
- Use specialized Python libraries (RDKit, SPARQL, etc.)
- Vector stores and knowledge bases for domain expertise

## Deployment
Python agents are deployed separately from the main Node.js application to allow for:
- Independent scaling
- Specialized Python environments
- Domain-specific model optimization