#!/bin/bash

# Formul8 GitHub Repository Setup Script
# Creates main repository and all agent submodules with GitHub Projects integration

set -e

# Configuration
ORG_NAME="formul8"
MAIN_REPO="formul8-platform"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Agent repositories
AGENTS=(
    "base-agent"
    "compliance-agent"
    "science-agent"
    "formulation-agent"
    "marketing-agent"
    "operations-agent"
    "patent-agent"
    "sourcing-agent"
    "spectra-agent"
    "customer-success-agent"
)

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed. Please install it first.${NC}"
    echo "Visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Please authenticate with GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

echo -e "${BLUE}Setting up Formul8 GitHub Organization and Repositories...${NC}"

# Function to create repository
create_repo() {
    local repo_name=$1
    local description=$2
    local is_private=${3:-false}
    
    echo -e "${YELLOW}Creating repository: ${repo_name}${NC}"
    
    if gh repo create "${ORG_NAME}/${repo_name}" \
        --description "${description}" \
        --${is_private:+private}${is_private:-public} \
        --clone; then
        echo -e "${GREEN}✓ Created ${repo_name}${NC}"
    else
        echo -e "${RED}✗ Failed to create ${repo_name}${NC}"
        return 1
    fi
}

# Function to setup GitHub Project
create_project() {
    local repo_name=$1
    local project_name=$2
    
    echo -e "${YELLOW}Creating GitHub Project for ${repo_name}${NC}"
    
    # Create project (GitHub CLI v2+ syntax)
    if gh project create \
        --owner "${ORG_NAME}" \
        --title "${project_name}" \
        --body "Project management for ${repo_name} development and improvements"; then
        echo -e "${GREEN}✓ Created project ${project_name}${NC}"
    else
        echo -e "${RED}✗ Failed to create project ${project_name}${NC}"
    fi
}

# Function to initialize agent repository
setup_agent_repo() {
    local agent_name=$1
    local description=$2
    
    echo -e "${BLUE}Setting up ${agent_name}...${NC}"
    
    cd "${ORG_NAME}-${agent_name}" || return 1
    
    # Create basic structure
    mkdir -p src tests docs
    
    # Create package.json
    cat > package.json << EOF
{
  "name": "@${ORG_NAME}/${agent_name}",
  "version": "1.0.0",
  "description": "${description}",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "openai": "^4.20.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0"
  },
  "keywords": ["cannabis", "ai", "agent", "${agent_name}"],
  "license": "MIT"
}
EOF

    # Create TypeScript config
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

    # Create README
    cat > README.md << EOF
# ${agent_name^}

${description}

## Features

- Specialized AI agent for cannabis industry
- Integration with Formul8 platform
- OpenAI GPT-4o powered responses
- Production-ready architecture

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Integration

This agent is designed to be used as a Git submodule in the main Formul8 platform:

\`\`\`bash
git submodule add https://github.com/${ORG_NAME}/${agent_name}.git server/agents/${agent_name/-agent/}
\`\`\`

## Development

1. Make changes to the agent
2. Test thoroughly
3. Update version in package.json
4. Commit and push
5. Update submodule reference in main platform

## License

MIT
EOF

    # Create basic agent implementation
    cat > src/index.ts << EOF
import { BaseAgent } from '@${ORG_NAME}/base-agent';

export class ${agent_name^//-/} extends BaseAgent {
  constructor() {
    super('${agent_name/-agent/}', \`You are a specialized ${agent_name/-agent/} agent for the cannabis industry.\`);
  }

  async processQuery(query: string): Promise<any> {
    // Implementation specific to ${agent_name/-agent/}
    return await this.callOpenAI(query);
  }
}

export default ${agent_name^//-/};
EOF

    # Initial commit
    git add .
    git commit -m "Initial ${agent_name} setup with TypeScript and basic structure"
    git push origin main
    
    cd ..
    
    echo -e "${GREEN}✓ ${agent_name} setup complete${NC}"
}

# Create main platform repository
echo -e "${BLUE}Creating main platform repository...${NC}"
create_repo "${MAIN_REPO}" "Formul8 - AI Cannabis Operations Platform with Multi-Agent Orchestration" false

# Create base agent repository
echo -e "${BLUE}Creating base agent repository...${NC}"
create_repo "base-agent" "Base agent class and shared functionality for all Formul8 agents" false

# Create agent repositories
for agent in "${AGENTS[@]}"; do
    if [ "$agent" = "base-agent" ]; then
        continue  # Already created
    fi
    
    case $agent in
        "compliance-agent")
            description="Cannabis regulatory compliance agent with multi-state support"
            ;;
        "science-agent")
            description="Evidence-based research agent with PubMed integration"
            ;;
        "formulation-agent")
            description="Molecular analysis and formulation design agent with RDKit"
            ;;
        "marketing-agent")
            description="Cannabis marketing agent with platform-specific compliance"
            ;;
        "operations-agent")
            description="Cannabis operations and facility management agent"
            ;;
        "patent-agent")
            description="Intellectual property and patent analysis agent"
            ;;
        "sourcing-agent")
            description="Supply chain and vendor management agent"
            ;;
        "spectra-agent")
            description="Certificate of Analysis and GCMS data interpretation agent"
            ;;
        "customer-success-agent")
            description="Customer support and success optimization agent"
            ;;
    esac
    
    create_repo "$agent" "$description" false
done

# Create GitHub Projects
echo -e "${BLUE}Creating GitHub Projects...${NC}"

# Main orchestration project
create_project "${MAIN_REPO}" "Formul8 Platform Orchestration"

# Individual agent projects
for agent in "${AGENTS[@]}"; do
    agent_title="${agent^}"
    agent_title="${agent_title//-/ }"
    create_project "$agent" "${agent_title} Development"
done

# Setup repository structures
echo -e "${BLUE}Setting up repository structures...${NC}"

# Setup base agent first
echo -e "${YELLOW}Setting up base-agent repository...${NC}"
cd "${ORG_NAME}-base-agent" || exit 1

mkdir -p src tests docs
cat > package.json << 'EOF'
{
  "name": "@formul8/base-agent",
  "version": "1.0.0",
  "description": "Base agent class and shared functionality for all Formul8 agents",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "openai": "^4.20.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0"
  },
  "keywords": ["cannabis", "ai", "agent", "base"],
  "license": "MIT"
}
EOF

cat > src/index.ts << 'EOF'
import OpenAI from 'openai';

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected systemPrompt: string;
  protected openai?: OpenAI;

  constructor(agentType: string, systemPrompt: string) {
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  abstract processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse>;

  protected async callOpenAI(prompt: string, useJson = true): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const messages = [
        { role: "system" as const, content: this.systemPrompt },
        { role: "user" as const, content: prompt }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        ...(useJson && { response_format: { type: "json_object" as const } }),
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      return useJson ? JSON.parse(content || "{}") : content;
    } catch (error) {
      console.error(`Error in ${this.agentType} agent:`, error);
      throw new Error(`Failed to process query with ${this.agentType} agent`);
    }
  }

  protected calculateConfidence(response: any): number {
    if (response.confidence) return Math.min(100, Math.max(0, response.confidence));
    
    const hasResponse = response.response && response.response.length > 10;
    const hasSources = response.sources && response.sources.length > 0;
    
    if (hasResponse && hasSources) return 85;
    if (hasResponse) return 70;
    return 50;
  }

  protected createErrorResponse(query: any, error: any): AgentResponse {
    return {
      agent: this.agentType,
      response: `Error processing query: ${error.message}`,
      confidence: 0,
      sources: [],
      metadata: { error: true, errorMessage: error.message },
      requiresHumanVerification: true
    };
  }
}

export default BaseAgent;
EOF

git add .
git commit -m "Initial base agent implementation with OpenAI integration"
git push origin main

cd ..

# Setup other agent repositories
for agent in "${AGENTS[@]}"; do
    if [ "$agent" = "base-agent" ]; then
        continue
    fi
    
    case $agent in
        "compliance-agent")
            description="Cannabis regulatory compliance agent with multi-state support"
            ;;
        "science-agent")
            description="Evidence-based research agent with PubMed integration"
            ;;
        "formulation-agent")
            description="Molecular analysis and formulation design agent with RDKit"
            ;;
        "marketing-agent")
            description="Cannabis marketing agent with platform-specific compliance"
            ;;
        "operations-agent")
            description="Cannabis operations and facility management agent"
            ;;
        "patent-agent")
            description="Intellectual property and patent analysis agent"
            ;;
        "sourcing-agent")
            description="Supply chain and vendor management agent"
            ;;
        "spectra-agent")
            description="Certificate of Analysis and GCMS data interpretation agent"
            ;;
        "customer-success-agent")
            description="Customer support and success optimization agent"
            ;;
    esac
    
    setup_agent_repo "$agent" "$description"
done

# Setup main platform with submodules
echo -e "${BLUE}Setting up main platform with submodules...${NC}"
cd "${ORG_NAME}-${MAIN_REPO}" || exit 1

# Copy current project structure
cp -r ../../* . 2>/dev/null || true

# Add submodules
mkdir -p server/agents
for agent in "${AGENTS[@]}"; do
    if [ "$agent" = "base-agent" ]; then
        git submodule add "https://github.com/${ORG_NAME}/${agent}.git" "server/agents/shared"
    else
        agent_dir="${agent/-agent/}"
        git submodule add "https://github.com/${ORG_NAME}/${agent}.git" "server/agents/${agent_dir}"
    fi
done

# Create .gitmodules update script
cat > scripts/update-submodules.sh << 'EOF'
#!/bin/bash
# Update all agent submodules to latest versions

echo "Updating all agent submodules..."

git submodule update --init --recursive
git submodule foreach git pull origin main

echo "All submodules updated!"
EOF

chmod +x scripts/update-submodules.sh

# Create comprehensive README
cat > README.md << EOF
# Formul8 - AI Cannabis Operations Platform

A comprehensive AI-powered consultant platform for the cannabis industry featuring specialized AI agents with LangGraph-based multi-agent orchestration, N8N workflow automation, and GitHub Projects integration for agent self-improvement.

## 🌟 Features

- **9 Specialized AI Agents**: Each with domain expertise in cannabis operations
- **Multi-Agent Orchestration**: LangGraph-powered coordination with cross-verification
- **Scientific Research**: PubMed integration for evidence-based analysis
- **Molecular Analysis**: RDKit integration for chemical informatics
- **N8N Workflow Automation**: Automated compliance and marketing workflows
- **Real-time Monitoring**: Performance metrics and health monitoring
- **Modular Architecture**: Git submodules for independent agent development

## 🏗️ Architecture

### Agent Ecosystem

1. **Compliance Agent** - Multi-state regulatory compliance
2. **Science Agent** - PubMed research and literature validation
3. **Formulation Agent** - RDKit molecular analysis and design
4. **Marketing Agent** - Platform-specific advertising strategies
5. **Operations Agent** - Cultivation and facility management
6. **Patent Agent** - Intellectual property protection
7. **Sourcing Agent** - Supply chain optimization
8. **Spectra Agent** - CoA and GCMS data interpretation
9. **Customer Success Agent** - Support automation

### Technology Stack

- **Frontend**: React 18 + TypeScript, Vite, Shadcn/UI, TanStack Query
- **Backend**: Node.js + Express, PostgreSQL + Drizzle, OpenAI GPT-4o
- **Integration**: PubMed API, RDKit Chemistry, Streamlit, N8N Workflows
- **Authentication**: Replit Auth with session management
- **Deployment**: Replit platform with auto-scaling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- GitHub account

### Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone https://github.com/${ORG_NAME}/${MAIN_REPO}.git
   cd ${MAIN_REPO}
   \`\`\`

2. **Initialize submodules**:
   \`\`\`bash
   git submodule update --init --recursive
   \`\`\`

3. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

4. **Setup environment**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your credentials
   \`\`\`

5. **Initialize database**:
   \`\`\`bash
   npm run db:push
   \`\`\`

6. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📁 Project Structure

\`\`\`
${MAIN_REPO}/
├── client/                 # React frontend
├── server/                 # Express backend
│   └── agents/             # AI agents (submodules)
│       ├── shared/         # Base agent (formul8/base-agent)
│       ├── compliance/     # Compliance agent
│       ├── science/        # Science agent (PubMed)
│       ├── formulation/    # Formulation agent (RDKit)
│       ├── marketing/      # Marketing agent (N8N)
│       ├── operations/     # Operations agent
│       ├── patent/         # Patent agent
│       ├── sourcing/       # Sourcing agent
│       ├── spectra/        # Spectra agent (CoA/GCMS)
│       └── customer-success/ # Customer success agent
├── shared/                 # Shared types and schemas
├── docs/                   # Documentation
└── scripts/                # Automation scripts
\`\`\`

## 🔧 Development

### Working with Agents

Each agent is an independent repository that can be developed separately:

\`\`\`bash
# Update all agents to latest versions
./scripts/update-submodules.sh

# Work on specific agent
cd server/agents/science
git checkout -b feature/new-capability
# Make changes...
git commit -m "Add new capability"
git push origin feature/new-capability
\`\`\`

### Testing

\`\`\`bash
# Run all tests
npm test

# Test specific agent
cd server/agents/science
npm test

# Run benchmarks
npm run benchmark
\`\`\`

### Database Management

\`\`\`bash
# Push schema changes
npm run db:push

# Generate migration
npm run db:generate

# View database
npm run db:studio
\`\`\`

## 🤖 Agent Development

### Creating a New Agent

1. **Create new repository**:
   \`\`\`bash
   gh repo create ${ORG_NAME}/my-agent --public
   \`\`\`

2. **Setup agent structure**:
   \`\`\`bash
   # Use base agent template
   git clone https://github.com/${ORG_NAME}/base-agent.git my-agent
   cd my-agent
   # Customize for your agent...
   \`\`\`

3. **Add to main platform**:
   \`\`\`bash
   cd ${MAIN_REPO}
   git submodule add https://github.com/${ORG_NAME}/my-agent.git server/agents/my-agent
   \`\`\`

### Agent Requirements

- Extend \`BaseAgent\` class
- Implement \`processQuery\` method
- Include comprehensive tests
- Document API and capabilities
- Follow TypeScript best practices

## 📊 Monitoring

- **Performance Dashboard**: Real-time agent metrics
- **Health Checks**: Automated system monitoring
- **Error Tracking**: Comprehensive logging
- **Usage Analytics**: Query patterns and success rates

## 🔐 Security

- **Authentication**: Replit OAuth integration
- **Session Management**: PostgreSQL-backed sessions
- **API Security**: Rate limiting and validation
- **Data Protection**: Encrypted sensitive data

## 📝 Documentation

- [Agent Development Guide](docs/agent-development.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Follow code review process

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/${ORG_NAME}/${MAIN_REPO}/issues)
- **Discussions**: [GitHub Discussions](https://github.com/${ORG_NAME}/${MAIN_REPO}/discussions)
- **Email**: support@formul8.ai

---

Built with ❤️ for the cannabis industry
EOF

# Commit and push main platform
git add .
git commit -m "Initial Formul8 platform setup with all agent submodules"
git push origin main

cd ..

echo -e "${GREEN}✅ Formul8 GitHub setup complete!${NC}"
echo -e "${BLUE}Main Repository:${NC} https://github.com/${ORG_NAME}/${MAIN_REPO}"
echo -e "${BLUE}Organization:${NC} https://github.com/${ORG_NAME}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Clone the main repository: git clone https://github.com/${ORG_NAME}/${MAIN_REPO}.git"
echo "2. Initialize submodules: git submodule update --init --recursive"
echo "3. Setup environment variables and start development"
echo "4. Visit GitHub Projects for each agent to track development"

echo -e "\n${GREEN}All repositories and projects created successfully!${NC}"