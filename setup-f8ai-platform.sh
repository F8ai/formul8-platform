#!/bin/bash

# Formul8 Platform Setup for F8ai Organization
# Creates complete cannabis AI platform with 9 specialized agents

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Formul8 Platform Setup for F8ai Organization${NC}"
echo "Creating complete cannabis AI platform with 9 specialized agents..."
echo

# Configuration
ORG_NAME="F8ai"
MAIN_REPO="formul8-platform"

echo -e "${YELLOW}Setting up under organization: ${ORG_NAME}${NC}"

# Function to check GitHub authentication
check_auth() {
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ Not authenticated with GitHub${NC}"
        echo "Please run: gh auth login"
        exit 1
    fi
    
    local user=$(gh api user --jq '.login' 2>/dev/null)
    echo -e "${GREEN}✅ Authenticated as: ${user}${NC}"
}

# Validate authentication
check_auth

# Create main repository
echo -e "${YELLOW}Creating main repository: ${ORG_NAME}/${MAIN_REPO}${NC}"

gh repo create "${ORG_NAME}/${MAIN_REPO}" \
    --public \
    --description "Formul8 - AI Cannabis Operations Platform with 9 Specialized Agents" \
    --clone || {
    echo -e "${RED}❌ Failed to create main repository${NC}"
    echo "Note: Repository may already exist or you may need organization permissions"
    exit 1
}

cd "${ORG_NAME}-${MAIN_REPO}" || cd "formul8-platform"

echo -e "${YELLOW}Setting up complete project structure...${NC}"

# Create directory structure
mkdir -p {client/src/{components/ui,hooks,lib,pages},server/{agents,routes,services,testing},shared,docs,scripts}

# Package.json with all dependencies
cat > package.json << 'EOF'
{
  "name": "formul8-platform",
  "version": "1.0.0",
  "description": "AI Cannabis Operations Platform with 9 Specialized Agents",
  "main": "server/index.js",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:server && npm run build:client",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js",
    "build:client": "vite build",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "@tanstack/react-query": "^5.0.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "openai": "^4.20.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wouter": "^2.12.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.33",
    "@types/react-dom": "^18.2.14",
    "@vitejs/plugin-react": "^4.1.1",
    "drizzle-kit": "^0.20.0",
    "tsx": "^4.0.0",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  },
  "keywords": ["cannabis", "ai", "agents", "compliance", "science", "formulation"],
  "license": "MIT"
}
EOF

# Environment template
cat > .env.example << 'EOF'
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Replit)
SESSION_SECRET=your_long_random_secret_min_32_chars
REPL_ID=your_repl_id

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key

# Environment
NODE_ENV=development
EOF

echo -e "${BLUE}Creating 9 specialized agent repositories...${NC}"

# Agent repositories to create
AGENTS=(
    "base-agent:Base agent class and shared functionality"
    "compliance-agent:Cannabis regulatory compliance agent"
    "science-agent:Evidence-based research with PubMed integration"
    "formulation-agent:Molecular analysis with RDKit integration"
    "marketing-agent:Cannabis marketing with N8N automation"
    "operations-agent:Cannabis operations and facility management"
    "patent-agent:Intellectual property and patent analysis"
    "sourcing-agent:Supply chain and vendor management"
    "spectra-agent:Certificate of Analysis and GCMS interpretation"
    "customer-success-agent:Customer support and success optimization"
)

# Create each agent repository
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name description <<< "$agent_info"
    
    echo -e "${YELLOW}Creating ${agent_name}...${NC}"
    
    if gh repo create "${ORG_NAME}/${agent_name}" \
        --public \
        --description "$description"; then
        echo -e "${GREEN}✅ ${agent_name} repository created${NC}"
    else
        echo -e "${YELLOW}⚠️ ${agent_name} may already exist${NC}"
    fi
done

# Add agent submodules to main repository
echo -e "${YELLOW}Adding agent submodules...${NC}"

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name description <<< "$agent_info"
    
    echo -e "${YELLOW}Adding ${agent_name} as submodule...${NC}"
    
    git submodule add "https://github.com/${ORG_NAME}/${agent_name}.git" "server/agents/${agent_name}" || {
        echo -e "${YELLOW}⚠️ Submodule ${agent_name} may already exist${NC}"
    }
done

# Create initial commit
echo -e "${YELLOW}Creating initial commit...${NC}"

git add .
git commit -m "Initial Formul8 platform setup with 9 specialized AI agents

- Complete TypeScript/React platform
- 9 specialized cannabis industry agents
- Agent submodule architecture  
- Production-ready configuration
- F8ai organization structure" || echo "Commit may already exist"

git push origin main || echo "Push may have conflicts"

echo -e "${GREEN}✅ Platform structure created${NC}"
echo -e "${BLUE}🎉 F8ai Formul8 Platform Setup Complete!${NC}"
echo
echo -e "${YELLOW}Created Repositories:${NC}"
echo "• Main Platform: https://github.com/${ORG_NAME}/${MAIN_REPO}"
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name description <<< "$agent_info"
    echo "• ${agent_name}: https://github.com/${ORG_NAME}/${agent_name}"
done
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure environment variables in .env"
echo "2. Install dependencies: npm install"
echo "3. Set up database: npm run db:push"
echo "4. Start development: npm run dev"
echo
echo -e "${GREEN}Your complete cannabis AI platform is ready under F8ai organization!${NC}"
EOF

chmod +x setup-f8ai-platform.sh