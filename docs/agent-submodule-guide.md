# Agent Submodule Development Guide

## Overview

The Formul8 platform uses Git submodules for independent agent development. Each agent is a separate repository under the F8ai organization that can be developed, tested, and deployed independently while maintaining integration with the main platform.

## Architecture

```
formul8-platform/                    # Main platform repository
├── server/agents/                   # Agent submodules directory
│   ├── base-agent/                  # Git submodule: F8ai/base-agent
│   ├── science-agent/               # Git submodule: F8ai/science-agent
│   ├── compliance-agent/            # Git submodule: F8ai/compliance-agent
│   ├── formulation-agent/           # Git submodule: F8ai/formulation-agent
│   ├── marketing-agent/             # Git submodule: F8ai/marketing-agent
│   ├── operations-agent/            # Git submodule: F8ai/operations-agent
│   ├── patent-agent/                # Git submodule: F8ai/patent-agent
│   ├── sourcing-agent/              # Git submodule: F8ai/sourcing-agent
│   ├── spectra-agent/               # Git submodule: F8ai/spectra-agent
│   └── customer-success-agent/      # Git submodule: F8ai/customer-success-agent
└── .gitmodules                      # Submodule configuration
```

## Setup Process

### 1. Initialize Submodules

Run the setup script to configure all agent submodules:

```bash
./scripts/setup-agent-submodules.sh
```

This script will:
- Create missing agent repositories in F8ai organization
- Initialize each repository with development environment
- Set up Git submodules in the main platform
- Configure package.json and TypeScript for each agent

### 2. Manual Submodule Operations

```bash
# Initialize submodules after cloning main repository
git submodule init
git submodule update

# Update all submodules to latest
git submodule update --remote --merge

# Update specific submodule
git submodule update --remote server/agents/science-agent
```

## Independent Development Workflow

### 1. Clone Individual Agent

```bash
# Clone any agent repository for independent development
git clone https://github.com/F8ai/science-agent.git
cd science-agent

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Agent Structure

Each agent repository includes:

```
agent-repository/
├── src/
│   ├── index.ts                     # Main agent implementation
│   ├── types.ts                     # Agent-specific types
│   └── utils.ts                     # Utility functions
├── tests/
│   └── agent.test.ts                # Agent tests
├── docs/
│   └── README.md                    # Agent documentation
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── .gitignore                       # Git ignore rules
```

### 3. Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Agent Interface Standard

All agents must implement the standard interface:

```typescript
interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  processQuery(query: string, context?: any): Promise<AgentResponse>;
}
```

## Integration with Main Platform

### 1. Update Submodule in Main Platform

```bash
# In main platform repository
cd server/agents/science-agent
git pull origin main

# Commit submodule update
cd ../../../
git add server/agents/science-agent
git commit -m "Update science-agent submodule"
git push
```

### 2. Dynamic Discovery

The platform includes automatic agent discovery that:
- Scans F8ai organization repositories
- Identifies agent repositories by naming convention
- Generates dynamic interfaces for each agent
- Provides individual chat interfaces

### 3. Testing Integration

```bash
# Test agent in main platform context
npm run test:agents

# Test specific agent integration
npm run test:agent science-agent
```

## Repository Management

### 1. Creating New Agent

```bash
# Create new agent repository
gh repo create F8ai/new-agent --public --description "New agent for Formul8 platform"

# Add as submodule
git submodule add https://github.com/F8ai/new-agent.git server/agents/new-agent
```

### 2. Removing Agent

```bash
# Remove submodule
git submodule deinit server/agents/old-agent
git rm server/agents/old-agent
git commit -m "Remove old-agent submodule"
```

### 3. Submodule Best Practices

1. **Always commit submodule updates** in main platform
2. **Use descriptive commit messages** for submodule changes
3. **Test integration** before pushing updates
4. **Document agent changes** in both repositories
5. **Coordinate releases** between agents and platform

## Development Best Practices

### 1. Agent Development

- **Single Responsibility**: Each agent focuses on specific domain
- **Standard Interface**: Implement required agent interface
- **Error Handling**: Robust error handling with fallbacks
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear API and usage documentation

### 2. Version Management

- **Semantic Versioning**: Use semver for agent releases
- **Compatibility**: Maintain backward compatibility
- **Dependencies**: Keep dependencies updated and minimal
- **Security**: Regular security audits and updates

### 3. Collaboration

- **Feature Branches**: Use feature branches for development
- **Pull Requests**: Code review through pull requests
- **Issue Tracking**: Use GitHub issues for bug tracking
- **Project Boards**: Use GitHub Projects for coordination

## Deployment

### 1. Individual Agent Deployment

Each agent can be deployed independently:

```bash
# Build agent
npm run build

# Deploy to production
npm run deploy
```

### 2. Platform Integration Deployment

Main platform automatically integrates latest agent versions:

```bash
# Update all submodules
git submodule update --remote --merge

# Deploy main platform
npm run deploy
```

## Troubleshooting

### Common Issues

1. **Submodule not updating**:
   ```bash
   git submodule update --remote --force
   ```

2. **Merge conflicts in submodules**:
   ```bash
   cd server/agents/problem-agent
   git reset --hard origin/main
   ```

3. **Missing submodule after clone**:
   ```bash
   git submodule init
   git submodule update
   ```

### Getting Help

- Check agent repository README
- Review main platform documentation
- Open issues in respective repositories
- Contact development team

## Security Considerations

1. **API Keys**: Never commit API keys to repositories
2. **Environment Variables**: Use .env files for secrets
3. **Access Control**: Proper repository permissions
4. **Code Review**: Mandatory review for agent changes
5. **Dependencies**: Regular security audits

This guide enables independent development of cannabis AI agents while maintaining platform integration and consistency.