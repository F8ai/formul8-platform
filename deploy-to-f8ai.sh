#!/bin/bash

# Deploy Current Platform to F8ai Organization
# This script copies the current working platform to F8ai repositories

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ORG_NAME="F8ai"
MAIN_REPO="formul8-platform"
TEMP_DIR="/tmp/f8ai-deployment"

echo -e "${BLUE}🚀 Deploying Platform to F8ai Organization${NC}"
echo "Copying current working platform to F8ai repositories..."
echo

# Create temporary directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Clone main repository
echo -e "${YELLOW}Cloning main repository...${NC}"
git clone "https://github.com/${ORG_NAME}/${MAIN_REPO}.git"
cd "$MAIN_REPO"

# Copy all platform files from current workspace
echo -e "${YELLOW}Copying platform files...${NC}"

# Copy main configuration files
cp /home/runner/workspace/package.json .
cp /home/runner/workspace/tsconfig.json .
cp /home/runner/workspace/.env.example .
cp /home/runner/workspace/components.json .
cp /home/runner/workspace/drizzle.config.ts .
cp /home/runner/workspace/postcss.config.js .
cp /home/runner/workspace/tailwind.config.ts .
cp /home/runner/workspace/vite.config.ts .

# Copy source directories
cp -r /home/runner/workspace/client .
cp -r /home/runner/workspace/server .
cp -r /home/runner/workspace/shared .

# Copy documentation
mkdir -p docs
cp /home/runner/workspace/replit.md .
cp /home/runner/workspace/F8AI-DEPLOYMENT-SUMMARY.md ./docs/
cp /home/runner/workspace/create-f8ai-repos.md ./docs/

# Create README for main platform
cat > README.md << 'EOF'
# Formul8 - AI Cannabis Operations Platform

## Overview

Formul8 is a comprehensive AI-powered consultation platform for the cannabis industry, featuring 9 specialized AI agents with advanced multi-agent orchestration, scientific research integration, and complete compliance management.

## Features

### 9 Specialized AI Agents
- **Science Agent**: PubMed integration for evidence-based research
- **Compliance Agent**: Multi-state cannabis regulatory compliance
- **Formulation Agent**: RDKit molecular analysis and design
- **Marketing Agent**: N8N workflow automation for compliant advertising
- **Operations Agent**: Facility management and optimization
- **Patent Agent**: Intellectual property analysis and protection
- **Sourcing Agent**: Supply chain and vendor management
- **Spectra Agent**: CoA and GCMS data interpretation
- **Customer Success Agent**: Support automation and optimization

### Technical Architecture
- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Backend**: Express.js with TypeScript and PostgreSQL
- **AI Integration**: OpenAI GPT-4o with specialized prompting
- **Authentication**: Replit OpenID Connect integration
- **Database**: Drizzle ORM with Neon PostgreSQL
- **Agent Architecture**: Modular Git submodule structure

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Replit account for authentication

### Installation

1. **Clone with submodules**:
   ```bash
   git clone --recursive https://github.com/F8ai/formul8-platform.git
   cd formul8-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Initialize database**:
   ```bash
   npm run db:push
   ```

5. **Start development**:
   ```bash
   npm run dev
   ```

## Environment Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Replit)
SESSION_SECRET=your_session_secret
REPL_ID=your_repl_id
REPLIT_DOMAINS=your-domain.replit.app

# AI Services
OPENAI_API_KEY=sk-your_openai_key

# Environment
NODE_ENV=development
```

## Agent Submodules

Each agent is maintained as an independent repository:

- `server/agents/base-agent` - Shared functionality
- `server/agents/science-agent` - PubMed research
- `server/agents/compliance-agent` - Regulatory compliance
- `server/agents/formulation-agent` - Molecular analysis
- `server/agents/marketing-agent` - Marketing automation
- `server/agents/operations-agent` - Operations management
- `server/agents/patent-agent` - IP protection
- `server/agents/sourcing-agent` - Supply chain
- `server/agents/spectra-agent` - Analytical data
- `server/agents/customer-success-agent` - Customer support

## Development

### Adding New Agents
1. Create new agent repository under F8ai organization
2. Add as submodule: `git submodule add https://github.com/F8ai/new-agent.git server/agents/new-agent`
3. Update agent routing in `server/routes.ts`
4. Add agent interface in frontend

### Updating Submodules
```bash
git submodule update --remote --merge
```

### Running Tests
```bash
npm run test
npm run benchmark
```

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Database Migrations
```bash
npm run db:generate
npm run db:push
```

## API Documentation

### Agent Query Processing
```bash
POST /api/query
Content-Type: application/json

{
  "query": "Your question here",
  "agentType": "science|compliance|formulation|...",
  "context": {}
}
```

### Response Format
```json
{
  "agent": "science",
  "response": "Detailed agent response",
  "confidence": 85,
  "sources": ["PubMed:12345", "Study:xyz"],
  "metadata": {
    "evidence_quality": "high",
    "validation_status": "verified"
  },
  "requiresHumanVerification": false
}
```

## Cannabis Industry Focus

### Regulatory Compliance
- Multi-state cannabis regulations
- Testing and quality requirements
- Packaging and labeling compliance
- License management and reporting

### Scientific Research
- Evidence-based product development
- Clinical study analysis
- Safety and efficacy research
- Pharmacological insights

### Operations Excellence
- Facility design and optimization
- Process automation and control
- Quality management systems
- Supply chain coordination

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- GitHub Issues: https://github.com/F8ai/formul8-platform/issues
- Documentation: https://github.com/F8ai/formul8-platform/docs

---

**Formul8** - Advancing Cannabis Through AI
EOF

# Commit and push
echo -e "${YELLOW}Committing platform files...${NC}"
git add .
git commit -m "Initial Formul8 platform deployment

- Complete TypeScript/React cannabis AI platform
- 9 specialized agents with OpenAI GPT-4o integration
- PostgreSQL database with Drizzle ORM
- Replit authentication system
- Agent routing and cross-verification
- Production-ready configuration
- Comprehensive documentation

Features:
- Science Agent with PubMed integration
- Compliance Agent for multi-state regulations
- Formulation Agent with RDKit molecular analysis
- Marketing Agent with N8N automation
- Operations, Patent, Sourcing, Spectra, and Customer Success agents
- Complete frontend interface with agent-specific pages
- Real-time query processing and response storage"

git push origin main

echo -e "${GREEN}✅ Platform deployed to F8ai/${MAIN_REPO}${NC}"
echo
echo -e "${BLUE}Deployment Complete!${NC}"
echo "• Main Platform: https://github.com/${ORG_NAME}/${MAIN_REPO}"
echo "• Clone with: git clone --recursive https://github.com/${ORG_NAME}/${MAIN_REPO}.git"
echo "• Next: Configure .env and run npm install && npm run dev"
echo
echo -e "${GREEN}🎉 F8ai Formul8 Platform is now live!${NC}"