#!/bin/bash

# Setup Git Submodules for Independent Agent Development
# This creates the proper submodule structure for the Formul8 platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ORG_NAME="F8ai"
AGENTS_DIR="server/agents"

echo -e "${BLUE}🔧 Setting up agent submodules for orchestrator platform${NC}"
echo

# Define all agents with their directories
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

# Function to initialize agent repository if empty
initialize_agent_repo() {
    local agent_name="$1"
    local temp_dir="/tmp/${agent_name}-init"
    
    echo -e "${YELLOW}Initializing ${agent_name} repository...${NC}"
    
    # Clean up any existing temp directory
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # Clone the repository
    git clone "https://github.com/${ORG_NAME}/${agent_name}.git"
    cd "$agent_name"
    
    # Check if repository needs initialization
    if ! git log --oneline -1 &>/dev/null 2>&1; then
        echo -e "${YELLOW}Repository is empty, initializing...${NC}"
        
        # Copy existing agent files if they exist in main repository
        local main_agent_dir="/home/runner/workspace/${AGENTS_DIR}/${agent_name}"
        if [ -d "$main_agent_dir" ]; then
            echo "Copying existing agent files..."
            cp -r "$main_agent_dir"/* ./ 2>/dev/null || true
        fi
        
        # Create directory structure
        mkdir -p src tests docs
        
        # Create package.json for independent development
        cat > package.json << EOF
{
  "name": "${agent_name}",
  "version": "1.0.0",
  "description": "${agent_name} for Formul8 cannabis AI platform",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "openai": "^4.20.0",
    "zod": "^3.22.4",
    "axios": "^1.6.0"
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
  "keywords": ["cannabis", "ai", "agent", "formul8"],
  "repository": {
    "type": "git",
    "url": "https://github.com/${ORG_NAME}/${agent_name}.git"
  },
  "license": "MIT"
}
EOF

        # Create TypeScript configuration
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

        # Create main index file if it doesn't exist
        if [ ! -f "src/index.ts" ]; then
            cat > src/index.ts << 'EOF'
export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

export interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  processQuery(query: string, context?: any): Promise<AgentResponse>;
}

export class CannabisAgent implements Agent {
  name: string;
  description: string;
  capabilities: string[];

  constructor() {
    this.name = process.env.AGENT_NAME || 'Cannabis Agent';
    this.description = 'AI agent for cannabis industry operations';
    this.capabilities = ['General Consultation', 'AI Processing'];
  }

  async processQuery(query: string, context?: any): Promise<AgentResponse> {
    try {
      const response = `Processing query: ${query}`;
      
      return {
        agent: this.name,
        response,
        confidence: 85,
        sources: ['internal'],
        metadata: { context }
      };
    } catch (error) {
      return {
        agent: this.name,
        response: 'An error occurred processing your request.',
        confidence: 0,
        metadata: { error: error.message }
      };
    }
  }
}

export default new CannabisAgent();
EOF
        fi

        # Create test file
        cat > tests/agent.test.ts << 'EOF'
import { describe, test, expect } from '@jest/globals';
import agent from '../src/index';

describe('Cannabis Agent', () => {
  test('should process query correctly', async () => {
    const result = await agent.processQuery('test query');
    
    expect(result.agent).toBeDefined();
    expect(result.response).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should have required properties', () => {
    expect(agent.name).toBeDefined();
    expect(agent.description).toBeDefined();
    expect(agent.capabilities).toBeInstanceOf(Array);
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
*.tsbuildinfo
EOF

        # Create comprehensive README
        cat > README.md << EOF
# ${agent_name}

Independent cannabis AI agent for the Formul8 platform.

## Independent Development

\`\`\`bash
# Clone for development
git clone https://github.com/${ORG_NAME}/${agent_name}.git
cd ${agent_name}

# Install dependencies
npm install

# Start development
npm run dev
\`\`\`

## Integration with Main Platform

This agent is integrated as a Git submodule in the main Formul8 platform:

\`\`\`bash
# In main platform
git submodule add https://github.com/${ORG_NAME}/${agent_name}.git server/agents/${agent_name}
\`\`\`

## Commands

- \`npm run dev\` - Development with hot reload
- \`npm run build\` - Build for production  
- \`npm run test\` - Run tests
- \`npm run lint\` - Lint code

## Agent Interface

Implements standard Formul8 agent interface for seamless integration.

## License

MIT
EOF

        # Initial commit
        git add .
        git commit -m "Initial ${agent_name} setup for independent development

- Standard Formul8 agent interface
- TypeScript development environment
- Jest testing framework
- Independent package.json
- Git submodule compatibility"

        git push origin main
        echo -e "${GREEN}✅ ${agent_name} initialized${NC}"
    else
        echo -e "${GREEN}✅ ${agent_name} already initialized${NC}"
    fi
    
    # Clean up temp directory
    cd /home/runner/workspace
    rm -rf "$temp_dir"
}

# Initialize all agent repositories
echo -e "${BLUE}Initializing agent repositories...${NC}"
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    initialize_agent_repo "$agent_name"
done

echo -e "${BLUE}Setting up submodules in orchestrator platform...${NC}"
cd /home/runner/workspace

# Remove existing agent directories if they exist and aren't submodules
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    
    if [ -d "$agent_dir" ] && [ ! -f "$agent_dir/.git" ]; then
        echo -e "${YELLOW}Removing existing ${agent_dir} directory...${NC}"
        rm -rf "$agent_dir"
    fi
done

# Add each agent as a submodule
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    
    echo -e "${YELLOW}Adding ${agent_name} as submodule...${NC}"
    
    # Remove from git if already tracked
    git rm -r "$agent_dir" 2>/dev/null || true
    
    # Add as submodule
    git submodule add "https://github.com/${ORG_NAME}/${agent_name}.git" "$agent_dir" 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Submodule ${agent_name} may already exist or have conflicts${NC}"
    }
done

# Initialize and update all submodules
echo -e "${BLUE}Initializing and updating submodules...${NC}"
git submodule init
git submodule update --recursive

# Create .gitmodules if it doesn't exist or update it
echo -e "${BLUE}Configuring .gitmodules...${NC}"

# Commit submodule changes
git add .gitmodules 2>/dev/null || true
for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_dir <<< "$agent_info"
    git add "$agent_dir" 2>/dev/null || true
done

git commit -m "Setup agent submodules for independent development

- Added all ${#AGENTS[@]} agents as Git submodules
- Each agent can be developed independently
- Maintains integration with orchestrator platform
- Enables parallel development workflows" 2>/dev/null || echo "No changes to commit"

echo -e "${GREEN}✅ Submodule setup complete!${NC}"
echo
echo -e "${BLUE}Independent Development Workflow:${NC}"
echo "1. Clone any agent: git clone https://github.com/${ORG_NAME}/AGENT-NAME.git"
echo "2. Develop independently with npm run dev"
echo "3. Update in main platform: git submodule update --remote"
echo "4. Commit submodule updates in orchestrator"
echo
echo -e "${BLUE}Submodule Commands:${NC}"
echo "• Update all: git submodule update --remote --merge"
echo "• Update one: git submodule update --remote server/agents/AGENT-NAME"
echo "• Pull latest: git submodule foreach git pull origin main"