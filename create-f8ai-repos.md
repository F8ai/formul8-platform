# F8ai Organization Repository Creation Guide

## Quick Setup Commands

Run these commands in your terminal after GitHub authentication:

### 1. Create Main Platform Repository
```bash
gh repo create F8ai/formul8-platform --public --description "Formul8 - AI Cannabis Operations Platform with 9 Specialized Agents"
```

### 2. Create All 9 Agent Repositories
```bash
gh repo create F8ai/base-agent --public --description "Base agent class and shared functionality"
gh repo create F8ai/science-agent --public --description "Evidence-based research with PubMed integration" 
gh repo create F8ai/compliance-agent --public --description "Cannabis regulatory compliance agent"
gh repo create F8ai/formulation-agent --public --description "Molecular analysis with RDKit integration"
gh repo create F8ai/marketing-agent --public --description "Cannabis marketing with N8N automation"
gh repo create F8ai/operations-agent --public --description "Cannabis operations and facility management"
gh repo create F8ai/patent-agent --public --description "Intellectual property and patent analysis"
gh repo create F8ai/sourcing-agent --public --description "Supply chain and vendor management"
gh repo create F8ai/spectra-agent --public --description "Certificate of Analysis and GCMS interpretation"
gh repo create F8ai/customer-success-agent --public --description "Customer support and success optimization"
```

### 3. Clone and Setup Main Platform
```bash
git clone https://github.com/F8ai/formul8-platform.git
cd formul8-platform
```

### 4. Copy Current Platform Files
Copy all files from the current workspace to the cloned repository:
- package.json
- All source code from client/, server/, shared/
- Configuration files (tsconfig.json, etc.)
- Documentation

### 5. Add Agent Submodules
```bash
git submodule add https://github.com/F8ai/base-agent.git server/agents/base-agent
git submodule add https://github.com/F8ai/science-agent.git server/agents/science-agent
git submodule add https://github.com/F8ai/compliance-agent.git server/agents/compliance-agent
git submodule add https://github.com/F8ai/formulation-agent.git server/agents/formulation-agent
git submodule add https://github.com/F8ai/marketing-agent.git server/agents/marketing-agent
git submodule add https://github.com/F8ai/operations-agent.git server/agents/operations-agent
git submodule add https://github.com/F8ai/patent-agent.git server/agents/patent-agent
git submodule add https://github.com/F8ai/sourcing-agent.git server/agents/sourcing-agent
git submodule add https://github.com/F8ai/spectra-agent.git server/agents/spectra-agent
git submodule add https://github.com/F8ai/customer-success-agent.git server/agents/customer-success-agent
```

### 6. Initial Commit and Push
```bash
git add .
git commit -m "Initial Formul8 platform with 9 specialized AI agents"
git push origin main
```

## Alternative: Manual Repository Creation

If you prefer using GitHub web interface:

1. Go to https://github.com/organizations/F8ai/repositories/new
2. Create each repository with the names and descriptions above
3. Clone the main platform repository
4. Copy the current platform code
5. Add submodules for each agent

## Platform Features Ready for Deployment

- ✅ 9 Specialized Cannabis AI Agents
- ✅ OpenAI GPT-4o Integration  
- ✅ Complete TypeScript/React Platform
- ✅ PostgreSQL Database with Drizzle ORM
- ✅ Replit Authentication System
- ✅ Agent Routing and Processing
- ✅ Cross-Agent Verification
- ✅ Production-Ready Configuration

## Post-Deployment Setup

After creating repositories:

1. **Environment Variables**: Configure .env with database and API keys
2. **Dependencies**: Run `npm install` in main platform
3. **Database**: Run `npm run db:push` to initialize schema  
4. **Development**: Run `npm run dev` to start platform
5. **Production**: Run `npm run build && npm start` for production

The complete cannabis AI platform is ready for immediate deployment under F8ai organization!