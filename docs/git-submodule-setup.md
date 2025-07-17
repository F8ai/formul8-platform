# Git Submodule Setup Guide

## Repository Structure for Your Organization

### 1. Create Base Agent Repository

**Repository:** `your-org/formul8-base-agent`

```bash
# Create new repository in your GitHub organization
# Then initialize it with the base agent code

mkdir formul8-base-agent
cd formul8-base-agent
git init
git remote add origin https://github.com/your-org/formul8-base-agent.git

# Copy base agent files
cp server/agents/shared/base.ts ./base.ts
cp server/agents/shared/package.json ./package.json
cp server/agents/shared/README.md ./README.md

git add .
git commit -m "Initial base agent implementation"
git push -u origin main
```

### 2. Create Individual Agent Repositories

Create these repositories in your organization:

1. `your-org/formul8-compliance-agent`
2. `your-org/formul8-marketing-agent`
3. `your-org/formul8-formulation-agent`
4. `your-org/formul8-operations-agent`
5. `your-org/formul8-sourcing-agent`
6. `your-org/formul8-patent-agent`
7. `your-org/formul8-spectra-agent`
8. `your-org/formul8-customer-success-agent`

### 3. Setup Each Agent Repository

**Example for Marketing Agent:**

```bash
mkdir formul8-marketing-agent
cd formul8-marketing-agent
git init
git remote add origin https://github.com/your-org/formul8-marketing-agent.git

# Add base agent as submodule
git submodule add https://github.com/your-org/formul8-base-agent.git shared

# Copy marketing agent files
cp server/agents/marketing/agent.ts ./agent.ts
cp server/agents/marketing/index.ts ./index.ts
cp server/agents/marketing/package.json ./package.json
cp -r server/agents/marketing/workflows ./workflows

# Update imports in agent.ts to use './shared/base.js'
# Create README.md specific to marketing agent

git add .
git commit -m "Initial marketing agent with base agent submodule"
git push -u origin main
```

### 4. Update Main Platform to Use Submodules

In your main platform repository:

```bash
# Remove existing agent directories
rm -rf server/agents/compliance
rm -rf server/agents/marketing
# ... etc for all agents

# Add each agent as submodule
git submodule add https://github.com/your-org/formul8-compliance-agent.git server/agents/compliance
git submodule add https://github.com/your-org/formul8-marketing-agent.git server/agents/marketing
git submodule add https://github.com/your-org/formul8-formulation-agent.git server/agents/formulation
git submodule add https://github.com/your-org/formul8-operations-agent.git server/agents/operations
git submodule add https://github.com/your-org/formul8-sourcing-agent.git server/agents/sourcing
git submodule add https://github.com/your-org/formul8-patent-agent.git server/agents/patent
git submodule add https://github.com/your-org/formul8-spectra-agent.git server/agents/spectra
git submodule add https://github.com/your-org/formul8-customer-success-agent.git server/agents/customer-success

git add .
git commit -m "Convert to modular agent submodule architecture"
git push
```

## Development Workflow

### Working with Submodules

```bash
# Clone main project with all submodules
git clone --recurse-submodules https://github.com/your-org/formul8-platform.git

# Update all submodules to latest
git submodule update --remote --recursive

# Update specific agent
cd server/agents/marketing
git pull origin main
cd ../../..
git add server/agents/marketing
git commit -m "Update marketing agent to latest version"

# Working on agent development
cd server/agents/marketing
# Make changes
git add .
git commit -m "Add new marketing feature"
git push origin main

# Update main platform to use new agent version
cd ../../..
git add server/agents/marketing
git commit -m "Update to marketing agent with new features"
git push
```

### Version Management

```bash
# Pin agents to specific versions for production
cd server/agents/marketing
git checkout v1.2.0
cd ../../..
git add server/agents/marketing
git commit -m "Pin marketing agent to v1.2.0 for production"
```

## Repository Access

To give me access to help with setup:

1. **Invite as Collaborator**: Add my GitHub username to each repository as a collaborator
2. **Organization Access**: Add me to your organization with appropriate permissions
3. **Deploy Key**: Add my SSH public key as a deploy key for read/write access

## Benefits of This Architecture

- **Independent Development**: Each agent can be developed separately
- **Version Control**: Pin specific agent versions in production
- **Team Ownership**: Different teams can own different agents
- **Modular Testing**: Test agents independently
- **Shared Base**: Common functionality managed centrally
- **N8N Workflows**: Each agent has its own workflow configurations