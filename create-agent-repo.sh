#!/bin/bash

# Quick script to create and initialize individual agent repository

AGENT_NAME="$1"
if [ -z "$AGENT_NAME" ]; then
    echo "Usage: ./create-agent-repo.sh AGENT_NAME"
    echo "Example: ./create-agent-repo.sh science-agent"
    exit 1
fi

ORG_NAME="F8ai"
REPO_URL="https://github.com/${ORG_NAME}/${AGENT_NAME}.git"

echo "🚀 Setting up ${AGENT_NAME} for independent development"

# Create temporary working directory
TEMP_DIR="/tmp/${AGENT_NAME}-setup"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Clone the repository
echo "Cloning ${AGENT_NAME}..."
git clone "$REPO_URL"
cd "$AGENT_NAME"

# Check if repository needs initialization
if ! git log --oneline -1 &>/dev/null; then
    echo "Initializing repository structure..."
    
    # Create package.json
    cat > package.json << EOF
{
  "name": "${AGENT_NAME}",
  "version": "1.0.0",
  "description": "${AGENT_NAME} for Formul8 cannabis AI platform",
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
  "keywords": ["cannabis", "ai", "agent", "${AGENT_NAME}"],
  "repository": {
    "type": "git",
    "url": "${REPO_URL}"
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

    # Create basic directory structure
    mkdir -p src tests docs

    # Create main agent implementation
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
      // TODO: Implement agent-specific logic
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

    # Create .env.example
    cat > .env.example << 'EOF'
# Agent Configuration
AGENT_NAME=Cannabis Agent
NODE_ENV=development

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Development
DEBUG=true
EOF

    # Create comprehensive README
    cat > README.md << EOF
# ${AGENT_NAME}

Cannabis AI agent for the Formul8 platform - specialized for cannabis industry operations.

## Quick Start

\`\`\`bash
# Clone and setup
git clone ${REPO_URL}
cd ${AGENT_NAME}
npm install

# Environment setup
cp .env.example .env
# Edit .env with your API keys

# Development
npm run dev
\`\`\`

## Development

### Commands

\`\`\`bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Lint code
npm start        # Start production server
\`\`\`

### Project Structure

\`\`\`
${AGENT_NAME}/
├── src/
│   └── index.ts          # Main agent implementation
├── tests/
│   └── agent.test.ts     # Test suite
├── docs/
│   └── README.md         # Documentation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment template
└── .gitignore           # Git ignore rules
\`\`\`

## Agent Interface

All Formul8 agents implement a standard interface:

\`\`\`typescript
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
\`\`\`

## Integration

### As Git Submodule

This agent integrates with the main Formul8 platform as a Git submodule:

\`\`\`bash
# In main platform
git submodule add ${REPO_URL} server/agents/${AGENT_NAME}
git submodule update --init --recursive
\`\`\`

### Independent Deployment

Can also be deployed independently:

\`\`\`bash
npm run build
npm start
\`\`\`

## Environment Variables

\`\`\`bash
AGENT_NAME=Agent display name
OPENAI_API_KEY=OpenAI API key for AI processing
NODE_ENV=development|production
DEBUG=Enable debug logging
\`\`\`

## Contributing

1. Fork the repository
2. Create feature branch: \`git checkout -b feature/new-feature\`
3. Make changes and add tests
4. Run tests: \`npm test\`
5. Commit changes: \`git commit -m "Add new feature"\`
6. Push to branch: \`git push origin feature/new-feature\`
7. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

- Repository: ${REPO_URL}
- Issues: ${REPO_URL}/issues
- Documentation: ${REPO_URL}/wiki
EOF

    # Initial commit
    git add .
    git commit -m "Initial ${AGENT_NAME} setup for independent development

- Complete TypeScript project structure
- Standard agent interface implementation
- Jest testing framework setup
- Development and production scripts
- Comprehensive documentation
- Git submodule compatibility
- Environment configuration"

    git push origin main
    echo "✅ ${AGENT_NAME} initialized for independent development"
else
    echo "✅ ${AGENT_NAME} already has content"
fi

echo "Repository ready at: ${REPO_URL}"
echo "Clone for development: git clone ${REPO_URL}"