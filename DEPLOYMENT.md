# Formul8 Platform Deployment Guide

## GitHub Repository Structure

### Main Repository
- **URL**: https://github.com/formul8/formul8-platform
- **Description**: Complete Formul8 platform with all 9 AI agents as submodules

### Agent Repositories (Submodules)
1. **Base Agent**: https://github.com/formul8/base-agent
2. **Compliance Agent**: https://github.com/formul8/compliance-agent
3. **Science Agent**: https://github.com/formul8/science-agent (NEW - PubMed integration)
4. **Formulation Agent**: https://github.com/formul8/formulation-agent (RDKit + Streamlit)
5. **Marketing Agent**: https://github.com/formul8/marketing-agent (N8N workflows)
6. **Operations Agent**: https://github.com/formul8/operations-agent
7. **Patent Agent**: https://github.com/formul8/patent-agent
8. **Sourcing Agent**: https://github.com/formul8/sourcing-agent
9. **Spectra Agent**: https://github.com/formul8/spectra-agent
10. **Customer Success Agent**: https://github.com/formul8/customer-success-agent

## Quick Deployment

### Option 1: Use Setup Script

```bash
# Make the script executable
chmod +x scripts/setup-github-repos.sh

# Set your GitHub token (optional, will prompt if not set)
export GITHUB_TOKEN="your_github_token_here"

# Run the setup script
./scripts/setup-github-repos.sh
```

### Option 2: Manual GitHub CLI Setup

```bash
# Authenticate with GitHub
gh auth login

# Create main repository
gh repo create formul8/formul8-platform --public --clone
cd formul8-formul8-platform

# Copy current project files
cp -r /path/to/current/project/* .

# Create and add each agent as submodule
git submodule add https://github.com/formul8/base-agent.git server/agents/shared
git submodule add https://github.com/formul8/compliance-agent.git server/agents/compliance
git submodule add https://github.com/formul8/science-agent.git server/agents/science
git submodule add https://github.com/formul8/formulation-agent.git server/agents/formulation
git submodule add https://github.com/formul8/marketing-agent.git server/agents/marketing
git submodule add https://github.com/formul8/operations-agent.git server/agents/operations
git submodule add https://github.com/formul8/patent-agent.git server/agents/patent
git submodule add https://github.com/formul8/sourcing-agent.git server/agents/sourcing
git submodule add https://github.com/formul8/spectra-agent.git server/agents/spectra
git submodule add https://github.com/formul8/customer-success-agent.git server/agents/customer-success

# Commit and push
git add .
git commit -m "Add all agent submodules"
git push origin main
```

## Project Setup for Development

### 1. Clone Repository with Submodules

```bash
# Clone the main repository
git clone --recursive https://github.com/formul8/formul8-platform.git
cd formul8-platform

# If already cloned, initialize submodules
git submodule update --init --recursive
```

### 2. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install Python dependencies for Formulation Agent
pip install -r server/agents/formulation/requirements.txt
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL (Neon PostgreSQL)
# - OPENAI_API_KEY
# - SESSION_SECRET
# - REPL_ID
# - ISSUER_URL
```

### 4. Database Setup

```bash
# Push database schema
npm run db:push

# Optional: Open database studio
npm run db:studio
```

### 5. Start Development Server

```bash
# Start both frontend and backend
npm run dev
```

## Replit Deployment

### 1. Import to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Enter: `https://github.com/formul8/formul8-platform`
5. Click "Import from GitHub"

### 2. Configure Environment Variables

In Replit, go to the "Secrets" tab and add:

```
DATABASE_URL=your_neon_database_url
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

### 3. Setup Database

Replit will automatically provision a PostgreSQL database. The `DATABASE_URL` will be available as an environment variable.

```bash
# In Replit shell
npm run db:push
```

### 4. Deploy

1. Click the "Deploy" button in Replit
2. Choose deployment settings
3. Your app will be available at: `https://your-repl-name.your-username.repl.co`

## Production Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your_host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database

# Authentication
SESSION_SECRET=your_long_random_secret
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: GitHub Integration
GITHUB_TOKEN=ghp_your_github_token
```

### Development vs Production

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

## GitHub Projects Setup

Each agent repository will have its own GitHub Project for tracking development:

1. **Formul8 Platform Orchestration** - Main coordination
2. **Base Agent Development** - Shared functionality
3. **Compliance Agent Development** - Regulatory features
4. **Science Agent Development** - Research capabilities
5. **Formulation Agent Development** - RDKit integration
6. **Marketing Agent Development** - N8N workflows
7. **Operations Agent Development** - Facility management
8. **Patent Agent Development** - IP protection
9. **Sourcing Agent Development** - Supply chain
10. **Spectra Agent Development** - Data analysis
11. **Customer Success Agent Development** - Support automation

## Submodule Management

### Update All Submodules

```bash
# Update all submodules to latest
git submodule update --remote

# Or use the provided script
./scripts/update-submodules.sh
```

### Work on Individual Agent

```bash
# Navigate to agent directory
cd server/agents/science

# Create feature branch
git checkout -b feature/new-capability

# Make changes and commit
git add .
git commit -m "Add new research capability"
git push origin feature/new-capability

# Create pull request for the agent repository
gh pr create --title "Add new research capability" --body "Description of changes"
```

### Update Main Platform

After agent changes are merged:

```bash
# In main platform repository
cd server/agents/science
git pull origin main
cd ../../../

# Commit submodule update
git add server/agents/science
git commit -m "Update Science Agent to latest version"
git push origin main
```

## Monitoring and Analytics

### Performance Monitoring

- Real-time agent performance metrics
- Response time tracking
- Confidence score analysis
- Error rate monitoring

### Usage Analytics

- Query pattern analysis
- Popular agent usage
- User engagement metrics
- Success rate tracking

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Database**: Use connection pooling and prepared statements
3. **Sessions**: PostgreSQL-backed with secure cookies
4. **Authentication**: Replit OAuth with proper validation
5. **Rate Limiting**: Implement for API endpoints

## Backup and Recovery

1. **Database Backups**: Automated Neon backups
2. **Code Repository**: GitHub with full history
3. **Environment Config**: Document all required variables
4. **Agent Versions**: Git submodules track specific commits

## Support and Maintenance

### Regular Tasks

1. Update dependencies monthly
2. Monitor agent performance
3. Review security updates
4. Update documentation
5. Backup configurations

### Troubleshooting

1. Check environment variables
2. Verify database connectivity
3. Review agent logs
4. Test individual components
5. Check submodule status

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Code style and standards
- Pull request process
- Testing requirements
- Documentation updates
- Agent development guidelines

---

For additional help, visit the [GitHub Discussions](https://github.com/formul8/formul8-platform/discussions) or create an [issue](https://github.com/formul8/formul8-platform/issues).