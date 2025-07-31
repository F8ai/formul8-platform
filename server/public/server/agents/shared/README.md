# Formul8 Base Agent

## Overview

The shared base agent provides common functionality for all Formul8 AI agents in the cannabis industry platform. This repository is designed to be included as a Git submodule in individual agent repositories.

## Architecture

This base agent is used by all specialized agents:
- Compliance Agent
- Marketing Agent  
- Formulation Agent
- Operations Agent
- Sourcing Agent
- Patent/Trademark Agent
- Spectra Agent (CoA/GCMS)
- Customer Success Agent

## Usage as Submodule

### In Agent Repositories

Each agent repository includes this as a submodule:

```bash
# Add base agent as submodule
git submodule add https://github.com/formul8/base-agent shared

# Import in agent code
import { BaseAgent, AgentResponse } from './shared/base.js';
```

### In Main Platform

The main platform includes all agents as submodules, each containing the base agent:

```bash
# Clone with all submodules recursively
git clone --recurse-submodules https://github.com/formul8/formul8-platform

# Update all submodules including nested base agent
git submodule update --remote --recursive
```

## Key Features

- **OpenAI Integration**: Standardized GPT-4o integration
- **Response Formatting**: Consistent agent response structure
- **Verification System**: Cross-agent verification protocols
- **Confidence Scoring**: Unified confidence calculation methods
- **Error Handling**: Standardized error management

## Agent Response Format

```typescript
interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Versioning

This base agent follows semantic versioning. Agent repositories should pin to specific versions for stability:

```json
{
  "submodules": {
    "shared": {
      "url": "https://github.com/formul8/base-agent",
      "branch": "v1.0.0"
    }
  }
}
```

## Cannabis Industry Compliance

All agents built on this base must maintain compliance with:
- State and local cannabis regulations
- Advertising restrictions and guidelines
- Data privacy requirements
- Industry best practices