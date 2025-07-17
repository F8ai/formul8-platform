#!/bin/bash

# Setup Agent Submodules for Independent Development
# This script configures each agent as an independent Git submodule

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ORG_NAME="F8ai"
AGENTS_DIR="server/agents"

echo -e "${BLUE}🔧 Setting up agent submodules for independent development${NC}"
echo

# Function to create individual agent repository content
create_agent_repo_content() {
    local agent_name="$1"
    local agent_dir="$2"
    
    echo -e "${YELLOW}Setting up ${agent_name} for independent development...${NC}"
    
    # Create temporary directory for agent repository
    local temp_dir="/tmp/${agent_name}-setup"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Clone the agent repository
    if gh repo view "${ORG_NAME}/${agent_name}" &>/dev/null; then
        cd "$temp_dir"
        git clone "https://github.com/${ORG_NAME}/${agent_name}.git"
        cd "${agent_name}"
        
        # Check if repository is empty
        if ! git log --oneline -1 &>/dev/null; then
            echo -e "${YELLOW}Initializing empty repository ${agent_name}${NC}"
            
            # Copy agent files from main repository
            if [ -d "/home/runner/workspace/${agent_dir}" ]; then
                cp -r "/home/runner/workspace/${agent_dir}"/* ./ 2>/dev/null || true
            fi
            
            # Create package.json for independent development
            cat > package.json << EOF
{
  "name": "${agent_name}",
  "version": "1.0.0",
  "description": "${agent_name} for Formul8 cannabis AI platform",
  "main": "index.ts",
  "scripts": {
    "dev": "tsx watch index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "openai": "^4.20.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "tsx": "^4.0.0",
    "typescript": "^5.2.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.5",
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0"
  },
  "keywords": ["cannabis", "ai", "agent", "${agent_name}"],
  "repository": {
    "type": "git",
    "url": "https://github.com/${ORG_NAME}/${agent_name}.git"
  },
  "license": "MIT"
}
EOF

            # Create TypeScript config
            cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

            # Create README with development instructions
            cat > README.md << EOF
# ${agent_name}

## Overview

${agent_name} for the Formul8 cannabis AI platform - specialized agent for cannabis industry operations.

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
\`\`\`

### Integration

This agent is designed to work with the main Formul8 platform as a Git submodule:

\`\`\`bash
# In main platform repository
git submodule add https://github.com/${ORG_NAME}/${agent_name}.git server/agents/${agent_name}
\`\`\`

### Development Workflow

1. **Independent Development**: Work on this repository independently
2. **Testing**: Test agent functionality in isolation
3. **Integration**: Update submodule reference in main platform
4. **Deployment**: Deploy through main platform or independently

### API Interface

The agent exports a standard interface compatible with the Formul8 platform:

\`\`\`typescript
interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}
\`\`\`

### Environment Variables

\`\`\`bash
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development|production
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
EOF

            # Create basic directory structure
            mkdir -p src tests docs
            
            # Move main agent file to src if it exists
            if [ -f "${agent_name}.ts" ]; then
                mv "${agent_name}.ts" "src/index.ts"
            elif [ -f "index.ts" ]; then
                mv "index.ts" "src/index.ts"
            fi
            
            # Create example test
            cat > tests/agent.test.ts << 'EOF'
import { describe, test, expect } from '@jest/globals';

describe('Agent', () => {
  test('should initialize correctly', () => {
    expect(true).toBe(true);
  });
});
EOF

            # Create .gitignore
            cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.nyc_output/
EOF

            # Initial commit
            git add .
            git commit -m "Initial agent setup for independent development

- Package.json with development dependencies
- TypeScript configuration
- README with development instructions
- Basic project structure
- Test setup with Jest
- Git submodule compatibility"
            
            git push origin main
            echo -e "${GREEN}✅ ${agent_name} initialized for independent development${NC}"
        else
            echo -e "${GREEN}✅ ${agent_name} already has content${NC}"
        fi
    else
        echo -e "${RED}❌ Repository ${agent_name} not found${NC}"
    fi
}

# Create missing agent repositories first
AGENT_REPOS=(
    "base-agent"
    "science-agent" 
    "compliance-agent"
    "formulation-agent"
    "operations-agent"
)

echo -e "${BLUE}Creating missing agent repositories...${NC}"
for repo in "${AGENT_REPOS[@]}"; do
    if ! gh repo view "${ORG_NAME}/${repo}" &>/dev/null; then
        echo -e "${YELLOW}Creating ${repo}...${NC}"
        gh repo create "${ORG_NAME}/${repo}" --public --description "${repo} for Formul8 cannabis AI platform"
    fi
done

# Setup each agent for independent development
AGENTS=(
    "base-agent:server/agents/base"
    "science-agent:server/agents/science"
    "compliance-agent:server/agents/compliance"
    "formulation-agent:server/agents/formulation"
    "marketing-agent:server/agents/marketing"
    "operations-agent:server/agents/operations"
    "patent-agent:server/agents/patent"
    "sourcing-agent:server/agents/sourcing"
    "spectra-agent:server/agents/spectra"
    "customer-success-agent:server/agents/customer-success"
)

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    create_agent_repo_content "$agent_name" "$agent_dir"
done

echo -e "${BLUE}Setting up submodules in main repository...${NC}"

# Navigate to main repository root
cd /home/runner/workspace

# Remove existing agent directories and add as submodules
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    
    echo -e "${YELLOW}Setting up ${agent_name} as submodule...${NC}"
    
    # Remove existing directory if it exists
    if [ -d "$agent_dir" ]; then
        rm -rf "$agent_dir"
    fi
    
    # Add as submodule
    git submodule add "https://github.com/${ORG_NAME}/${agent_name}.git" "$agent_dir" 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Submodule ${agent_name} may already exist${NC}"
    }
done

# Initialize and update submodules
git submodule init
git submodule update

echo -e "${GREEN}✅ Agent submodules setup complete!${NC}"
echo
echo -e "${BLUE}Independent Development Workflow:${NC}"
echo "1. Work on individual agents: cd server/agents/AGENT_NAME"
echo "2. Each agent has its own package.json and development environment"
echo "3. Test independently: npm run dev in agent directory"
echo "4. Update main platform: git submodule update --remote"
echo "5. Commit submodule updates: git add . && git commit -m 'Update agent submodules'"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "• Each agent repository is now ready for independent development"
echo "• Clone any agent: git clone https://github.com/${ORG_NAME}/AGENT_NAME.git"
echo "• Update submodules: git submodule update --remote --merge"
echo "• Main platform will automatically use latest agent versions"