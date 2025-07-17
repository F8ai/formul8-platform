# Formul8 Setup Scripts

## GitHub Repository Setup Script

The `setup-github-repos.sh` script automates the creation of all Formul8 agent repositories with proper Git submodule structure and GitHub issue integration.

### Prerequisites

1. **GitHub CLI installed**: `gh` command available
2. **GitHub authentication**: Run `gh auth login` first
3. **Organization access**: Permission to create repositories in your GitHub organization

### Usage

```bash
# Run the script with your organization name
./scripts/setup-github-repos.sh your-org-name

# Or run without arguments and enter org name when prompted
./scripts/setup-github-repos.sh
```

### What the Script Creates

#### Base Agent Repository
- `your-org/formul8-base-agent` - Shared base functionality for all agents
- Includes GitHub integration capabilities
- TypeScript/Node.js setup with proper exports

#### Individual Agent Repositories
- `your-org/formul8-compliance-agent`
- `your-org/formul8-marketing-agent`
- `your-org/formul8-formulation-agent`
- `your-org/formul8-operations-agent`
- `your-org/formul8-sourcing-agent`
- `your-org/formul8-patent-agent`
- `your-org/formul8-spectra-agent`
- `your-org/formul8-customer-success-agent`

#### Repository Features
- **Issue tracking enabled** with initial development issues
- **Branch protection** on main branch requiring PR reviews
- **Base agent submodule** included in each agent repository
- **GitHub integration code** for agents to create/manage issues
- **N8N workflow configurations** where applicable
- **Package.json** with proper dependencies and scripts

### GitHub Integration Features

Each agent can:
- **Create issues** for tracking compliance violations, recommendations, etc.
- **Update existing issues** with new findings or status changes
- **Comment on issues** with additional analysis or updates
- **Query issues** to understand previous findings and context
- **Log findings** with severity levels (low, medium, high, critical)

### Environment Variables Required

For GitHub integration to work, set these environment variables:

```bash
export GITHUB_TOKEN="your_github_personal_access_token"
export GITHUB_OWNER="your-organization-name"
export GITHUB_REPO="repository-name"  # Can be set per agent
```

### Post-Setup Steps

1. **Review repository settings** in GitHub web interface
2. **Configure team access** and permissions
3. **Set up GitHub Actions** for CI/CD (optional)
4. **Update main platform** to use submodules:
   ```bash
   # Remove existing agent directories
   rm -rf server/agents/compliance server/agents/marketing # etc.
   
   # Add as submodules
   git submodule add https://github.com/your-org/formul8-compliance-agent.git server/agents/compliance
   git submodule add https://github.com/your-org/formul8-marketing-agent.git server/agents/marketing
   # ... repeat for all agents
   ```

### Development Workflow

```bash
# Clone main project with all submodules
git clone --recurse-submodules https://github.com/your-org/formul8-platform.git

# Update all agents to latest versions
git submodule update --remote --recursive

# Work on specific agent
cd server/agents/marketing
git checkout -b feature/new-capability
# make changes
git commit -m "Add new marketing capability"
git push origin feature/new-capability
# create PR in agent repository

# Update main platform to use new agent version
cd ../../..
git add server/agents/marketing
git commit -m "Update marketing agent to latest version"
```

### Issue Labels

The script creates standardized labels for issue management:
- `enhancement` - New features or improvements
- `bug` - Bug reports and fixes
- `documentation` - Documentation updates
- `testing` - Test-related issues
- `compliance` - Compliance-related issues
- `ai-generated` - Issues created automatically by agents
- `priority-low/medium/high/critical` - Severity levels
- `[agent-name]` - Agent-specific labels

### Troubleshooting

**Authentication Issues:**
```bash
gh auth status  # Check authentication
gh auth login   # Re-authenticate if needed
```

**Permission Issues:**
- Ensure you have admin access to the GitHub organization
- Check that the organization allows repository creation

**Submodule Issues:**
```bash
git submodule update --init --recursive  # Initialize submodules
git submodule foreach git pull origin main  # Update all submodules
```