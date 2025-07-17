# Agent Repository Template

Use this template when creating each agent repository in your GitHub organization.

## Repository Structure

```
agent-name/
├── agent.ts                    # Main agent implementation
├── index.ts                    # Export definitions
├── package.json               # Dependencies and scripts
├── README.md                  # Agent-specific documentation
├── .gitmodules               # Base agent submodule reference
├── shared/                   # Git submodule: formul8/base-agent
│   ├── base.ts              # BaseAgent class
│   └── package.json         # Base agent dependencies
├── workflows/               # N8N workflow configurations
│   └── n8n-workflow.json   # Agent-specific N8N workflow
├── tests/                   # Agent-specific tests
│   └── agent.test.ts       # Unit tests
└── docs/                   # Agent documentation
    └── usage-guide.md      # Usage examples and API docs
```

## Package.json Template

```json
{
  "name": "@formul8/AGENT-NAME-agent",
  "version": "1.0.0",
  "description": "AGENT DESCRIPTION for cannabis industry operations",
  "main": "agent.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "update-base": "git submodule update --remote shared"
  },
  "keywords": ["cannabis", "AGENT-KEYWORDS", "AI", "agent"],
  "author": "Formul8",
  "license": "MIT",
  "dependencies": {
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

## Agent.ts Template

```typescript
import { BaseAgent, type AgentResponse } from './shared/base.js';

export class AGENTNAMEAgent extends BaseAgent {
  constructor() {
    super('AGENT-TYPE', `You are a cannabis AGENT-TYPE expert specializing in...

Your expertise includes:
- Key capability 1
- Key capability 2
- Key capability 3

When responding:
1. Always prioritize compliance with cannabis regulations
2. Provide specific, actionable recommendations
3. Consider jurisdiction-specific requirements
4. Cross-reference with compliance requirements

Respond in JSON format with:
{
  "response": "detailed guidance",
  "confidence": number (0-100),
  "AGENT_SPECIFIC_FIELD": "agent-specific data",
  "compliance_verified": boolean,
  "sources": ["source1", "source2"]
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    try {
      const prompt = `${query}

Context: ${JSON.stringify(context || {})}

Please provide expert guidance following the response format specified in your system prompt.`;

      const response = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: response.response || "Unable to process query",
        confidence: this.calculateConfidence(response),
        sources: response.sources || [],
        metadata: {
          agentSpecificField: response.AGENT_SPECIFIC_FIELD,
          complianceVerified: response.compliance_verified
        }
      };
    } catch (error) {
      console.error(`Error in ${this.agentType} agent:`, error);
      return {
        agent: this.agentType,
        response: "Error processing query. Please try again.",
        confidence: 0,
        sources: []
      };
    }
  }
}
```

## README.md Template

```markdown
# AGENT-NAME Agent

## Overview

This agent provides specialized AI assistance for cannabis industry AGENT-DOMAIN operations. It's part of the Formul8 multi-agent platform.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

```bash
# Clone with base agent submodule
git clone --recurse-submodules https://github.com/your-org/formul8-AGENT-NAME-agent.git

# Install dependencies
npm install

# Update base agent
npm run update-base
```

## Usage

```typescript
import { AGENTNAMEAgent } from './agent.js';

const agent = new AGENTNAMEAgent();
const response = await agent.processQuery("Your question here");
console.log(response);
```

## N8N Workflow

This agent includes N8N workflow configurations in the `workflows/` directory for automation integration.

## Development

```bash
# Run tests
npm test

# Build TypeScript
npm run build

# Lint code
npm run lint
```

## Compliance

This agent is designed specifically for cannabis industry compliance and follows all relevant regulations and best practices.
```

## Setup Commands

```bash
# 1. Create repository in GitHub organization
# 2. Clone and initialize
git clone https://github.com/your-org/formul8-AGENT-NAME-agent.git
cd formul8-AGENT-NAME-agent

# 3. Add base agent submodule
git submodule add https://github.com/your-org/formul8-base-agent.git shared

# 4. Copy template files and customize
# 5. Initial commit
git add .
git commit -m "Initial AGENT-NAME agent implementation"
git push -u origin main
```