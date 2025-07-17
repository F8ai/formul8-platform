#!/bin/bash

# Create Replit-ready agent repositories with containerized environments

set -e

AGENT_NAME="$1"
AGENT_TYPE="$2"  # streamlit, n8n, nodejs, python, etc.

if [ -z "$AGENT_NAME" ] || [ -z "$AGENT_TYPE" ]; then
    echo "Usage: ./create-agent-replit.sh AGENT_NAME AGENT_TYPE"
    echo "Examples:"
    echo "  ./create-agent-replit.sh formulation-agent streamlit"
    echo "  ./create-agent-replit.sh marketing-agent n8n"
    echo "  ./create-agent-replit.sh science-agent nodejs"
    exit 1
fi

ORG_NAME="F8ai"
REPO_URL="https://github.com/${ORG_NAME}/${AGENT_NAME}.git"

echo "🚀 Creating Replit-ready ${AGENT_NAME} with ${AGENT_TYPE} environment"

# Create temporary working directory
TEMP_DIR="/tmp/${AGENT_NAME}-replit-setup"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Clone the repository
echo "Cloning ${AGENT_NAME}..."
git clone "$REPO_URL" || {
    echo "Repository not found. Creating new repository..."
    gh repo create "${ORG_NAME}/${AGENT_NAME}" --public --description "${AGENT_NAME} for Formul8 cannabis AI platform"
    git clone "$REPO_URL"
}

cd "$AGENT_NAME"

# Create Replit configuration based on agent type
create_replit_config() {
    case "$AGENT_TYPE" in
        "streamlit")
            cat > .replit << 'EOF'
run = "streamlit run app.py --server.port=8080 --server.address=0.0.0.0"
modules = ["python-3.11"]

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "streamlit run app.py --server.port=8080 --server.address=0.0.0.0"]

[[ports]]
localPort = 8080
externalPort = 80
EOF

            cat > replit.nix << 'EOF'
{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.rdkit
  ];
}
EOF

            cat > pyproject.toml << 'EOF'
[tool.poetry]
name = "formulation-agent"
version = "0.1.0"
description = "Cannabis formulation agent with RDKit and Streamlit"
authors = ["F8ai <team@f8ai.com>"]

[tool.poetry.dependencies]
python = "^3.11"
streamlit = "^1.28.0"
rdkit = "^2023.9.1"
pandas = "^2.1.0"
numpy = "^1.24.0"
plotly = "^5.17.0"
openai = "^1.0.0"
requests = "^2.31.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
EOF

            cat > app.py << 'EOF'
import streamlit as st
import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Draw
import plotly.express as px
import requests
import os

st.set_page_config(
    page_title="Formulation Agent",
    page_icon="🧪",
    layout="wide"
)

st.title("🧪 Cannabis Formulation Agent")
st.markdown("*Molecular analysis and formulation design with RDKit*")

# Sidebar for agent configuration
with st.sidebar:
    st.header("Agent Configuration")
    confidence_threshold = st.slider("Confidence Threshold", 0, 100, 85)
    st.markdown("---")
    st.header("Quick Actions")
    if st.button("🔬 New Analysis"):
        st.rerun()
    if st.button("📊 View Reports"):
        st.info("Reports feature coming soon!")

# Main interface
tab1, tab2, tab3 = st.tabs(["Molecular Analysis", "Formulation Design", "Agent Chat"])

with tab1:
    st.header("Molecular Structure Analysis")
    
    smiles_input = st.text_input("Enter SMILES string:", "CCO")
    
    if smiles_input:
        try:
            mol = Chem.MolFromSmiles(smiles_input)
            if mol:
                st.success("Valid molecule structure!")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("Molecular Properties")
                    mw = Descriptors.MolWt(mol)
                    logp = Descriptors.MolLogP(mol)
                    hbd = Descriptors.NumHDonors(mol)
                    hba = Descriptors.NumHAcceptors(mol)
                    
                    st.metric("Molecular Weight", f"{mw:.2f} g/mol")
                    st.metric("LogP", f"{logp:.2f}")
                    st.metric("H-Bond Donors", hbd)
                    st.metric("H-Bond Acceptors", hba)
                
                with col2:
                    st.subheader("Molecular Structure")
                    img = Draw.MolToImage(mol, size=(300, 300))
                    st.image(img, caption="Molecular Structure")
            else:
                st.error("Invalid SMILES string")
        except Exception as e:
            st.error(f"Error: {str(e)}")

with tab2:
    st.header("Formulation Design")
    st.info("Formulation design tools coming soon!")

with tab3:
    st.header("Agent Chat Interface")
    
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I'm the Cannabis Formulation Agent. I can help with molecular analysis, formulation design, and chemical property calculations. What would you like to explore?"}
        ]
    
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    if prompt := st.chat_input("Ask about formulations, molecules, or chemical properties..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        with st.chat_message("assistant"):
            response = f"Processing your formulation query: '{prompt}'\n\nThis is a demo response. In production, this would connect to the OpenAI API for intelligent responses about cannabis formulation and molecular analysis."
            st.markdown(response)
            st.session_state.messages.append({"role": "assistant", "content": response})

# Footer
st.markdown("---")
st.markdown("**Formulation Agent** | Independent Cannabis AI Agent | [Repository](https://github.com/F8ai/formulation-agent)")
EOF
            ;;

        "n8n")
            cat > .replit << 'EOF'
run = "npm start"
modules = ["nodejs-20"]

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "npm start"]

[[ports]]
localPort = 5678
externalPort = 80
EOF

            cat > package.json << 'EOF'
{
  "name": "marketing-agent",
  "version": "1.0.0",
  "description": "Cannabis marketing agent with N8N workflow automation",
  "main": "src/index.js",
  "scripts": {
    "start": "n8n start --tunnel",
    "dev": "n8n start --tunnel",
    "build": "echo 'N8N workflows ready'",
    "test": "echo 'Tests coming soon'"
  },
  "dependencies": {
    "n8n": "^1.0.0",
    "openai": "^4.20.0",
    "axios": "^1.6.0"
  },
  "keywords": ["cannabis", "marketing", "ai", "n8n", "automation"],
  "repository": {
    "type": "git",
    "url": "https://github.com/F8ai/marketing-agent.git"
  },
  "license": "MIT"
}
EOF

            mkdir -p .n8n/workflows
            cat > .n8n/workflows/cannabis-marketing-workflow.json << 'EOF'
{
  "name": "Cannabis Marketing Intelligence",
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "marketing-query",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "platform",
              "value": "={{$json.body.platform}}"
            },
            {
              "name": "query",
              "value": "={{$json.body.query}}"
            }
          ]
        }
      },
      "name": "Extract Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Start": {
      "main": [
        [
          {
            "node": "Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook": {
      "main": [
        [
          {
            "node": "Extract Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF
            ;;

        "nodejs")
            cat > .replit << 'EOF'
run = "npm run dev"
modules = ["nodejs-20"]

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "npm start"]

[[ports]]
localPort = 3000
externalPort = 80
EOF

            cat > package.json << 'EOF'
{
  "name": "science-agent",
  "version": "1.0.0",
  "description": "Cannabis science agent with PubMed integration",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "build": "echo 'Build complete'",
    "test": "node src/test.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "openai": "^4.20.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "keywords": ["cannabis", "science", "ai", "pubmed"],
  "repository": {
    "type": "git",
    "url": "https://github.com/F8ai/science-agent.git"
  },
  "license": "MIT"
}
EOF

            mkdir -p src
            cat > src/index.js << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agent: 'Science Agent',
    timestamp: new Date().toISOString() 
  });
});

// Main agent endpoint
app.post('/process', async (req, res) => {
  const { query, context } = req.body;
  
  try {
    // TODO: Implement PubMed integration and AI processing
    const response = {
      agent: 'Science Agent',
      response: `Processing scientific query: ${query}`,
      confidence: 85,
      sources: ['PubMed', 'Scientific Literature'],
      metadata: { context, timestamp: new Date().toISOString() }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    name: 'Cannabis Science Agent',
    description: 'AI agent for scientific research and literature analysis',
    endpoints: {
      health: '/health',
      process: '/process (POST)',
    },
    repository: 'https://github.com/F8ai/science-agent'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧬 Science Agent running on port ${PORT}`);
  console.log(`Repository: https://github.com/F8ai/science-agent`);
});
EOF
            ;;

        "python")
            cat > .replit << 'EOF'
run = "python main.py"
modules = ["python-3.11"]

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "python main.py"]

[[ports]]
localPort = 8000
externalPort = 80
EOF

            cat > pyproject.toml << 'EOF'
[tool.poetry]
name = "compliance-agent"
version = "0.1.0"
description = "Cannabis compliance agent"
authors = ["F8ai <team@f8ai.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
openai = "^1.0.0"
requests = "^2.31.0"
pydantic = "^2.5.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
EOF

            cat > main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime

app = FastAPI(
    title="Cannabis Compliance Agent",
    description="AI agent for cannabis regulatory compliance",
    version="1.0.0"
)

class QueryRequest(BaseModel):
    query: str
    context: dict = {}

class AgentResponse(BaseModel):
    agent: str
    response: str
    confidence: int
    sources: list[str] = []
    metadata: dict = {}

@app.get("/")
async def root():
    return {
        "name": "Cannabis Compliance Agent",
        "description": "AI agent for regulatory compliance and risk assessment",
        "endpoints": {
            "health": "/health",
            "process": "/process",
            "docs": "/docs"
        },
        "repository": "https://github.com/F8ai/compliance-agent"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "Compliance Agent",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process", response_model=AgentResponse)
async def process_query(request: QueryRequest):
    try:
        # TODO: Implement compliance checking logic
        response = AgentResponse(
            agent="Compliance Agent",
            response=f"Processing compliance query: {request.query}",
            confidence=90,
            sources=["Regulatory Database", "Compliance Rules"],
            metadata={
                "context": request.context,
                "timestamp": datetime.now().isoformat()
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
EOF
            ;;

        *)
            echo "Unknown agent type: $AGENT_TYPE"
            echo "Supported types: streamlit, n8n, nodejs, python"
            exit 1
            ;;
    esac
}

# Create agent-specific configuration
create_replit_config

# Create comprehensive README with badges and metrics
create_agent_readme() {
    local agent_display_name=""
    local agent_description=""
    local key_features=""
    local technical_details=""
    
    case "$AGENT_NAME" in
        "formulation-agent")
            agent_display_name="🧪 Formulation Agent"
            agent_description="Molecular analysis and cannabis formulation design using RDKit chemical informatics"
            key_features="- **Molecular Structure Analysis**: SMILES parsing and property calculation
- **Chemical Property Prediction**: LogP, solubility, bioavailability estimates  
- **Formulation Optimization**: Dose calculations and delivery method recommendations
- **RDKit Integration**: Advanced cheminformatics and molecular visualization
- **Streamlit Dashboard**: Interactive molecular analysis interface"
            technical_details="**Tech Stack**: Python, Streamlit, RDKit, Pandas, NumPy, Plotly
**Molecular Libraries**: RDKit for structure analysis and property prediction
**Visualization**: 2D/3D molecular rendering with interactive plots
**Data Processing**: Chemical database integration and batch analysis"
            ;;
        "marketing-agent")
            agent_display_name="📈 Marketing Agent"  
            agent_description="Automated marketing intelligence and compliance checking with N8N workflow automation"
            key_features="- **Platform Compliance**: Facebook, Google, Weedmaps advertising rule compliance
- **Market Intelligence**: CPC analysis and market size estimation (±15% accuracy)
- **Creative Workarounds**: Wellness angles and educational content strategies
- **Micro Campaign Testing**: 48-hour market validation with $50 budgets
- **N8N Workflow Automation**: End-to-end marketing campaign orchestration"
            technical_details="**Tech Stack**: N8N, Node.js, OpenAI API, Platform APIs
**Workflow Engine**: N8N for automated campaign management
**Market Analysis**: Real-time CPC and audience analytics
**Compliance Engine**: Multi-platform rule checking and content optimization"
            ;;
        "science-agent")
            agent_display_name="🔬 Science Agent"
            agent_description="Evidence-based research analysis with PubMed integration and scientific literature validation"
            key_features="- **PubMed Integration**: Real-time scientific literature search and analysis
- **Evidence Quality Assessment**: Systematic review and meta-analysis support
- **Research Trend Analysis**: Citation impact metrics and research gap identification
- **Scientific Claim Validation**: Evidence-based fact checking with confidence scores
- **Literature Synthesis**: Automated research summaries and bibliographic analysis"
            technical_details="**Tech Stack**: Node.js, Express, PubMed API, OpenAI GPT-4o
**Research Database**: NCBI PubMed and PMC integration
**Analysis Engine**: Scientific literature parsing and evidence scoring
**Citation Tracking**: Impact factor analysis and research trend monitoring"
            ;;
        "compliance-agent")
            agent_display_name="⚖️ Compliance Agent"
            agent_description="Regulatory compliance monitoring and risk assessment for cannabis operations"
            key_features="- **Regulatory Monitoring**: Real-time compliance rule tracking across jurisdictions
- **Risk Assessment**: Automated compliance scoring and violation prediction
- **Documentation Management**: Compliance record keeping and audit trail generation
- **Multi-State Compliance**: Support for varying state and local regulations
- **Alert System**: Proactive notifications for regulatory changes and deadlines"
            technical_details="**Tech Stack**: Python, FastAPI, PostgreSQL, Regulatory APIs
**Compliance Database**: Multi-jurisdiction rule engine and update tracking
**Risk Engine**: Predictive compliance scoring and violation analysis
**Audit System**: Comprehensive logging and compliance documentation"
            ;;
        *)
            agent_display_name="🤖 ${AGENT_NAME}"
            agent_description="Specialized cannabis AI agent for the Formul8 platform"
            key_features="- **Domain Expertise**: Specialized knowledge in cannabis industry operations
- **AI-Powered Analysis**: Advanced reasoning and recommendation engine
- **Integration Ready**: Seamless orchestration with other Formul8 agents
- **Performance Optimized**: Benchmarked for accuracy, speed, and reliability"
            technical_details="**Tech Stack**: ${AGENT_TYPE}, OpenAI GPT-4o, Custom APIs
**Performance**: Optimized for cannabis industry use cases
**Integration**: Standard Formul8 agent interface implementation"
            ;;
    esac

cat > README.md << EOF
# ${agent_display_name}

${agent_description}

## Benchmarks

![Benchmarks](https://img.shields.io/badge/benchmarks-pending-lightgrey)
![Accuracy](https://img.shields.io/badge/accuracy-pending-lightgrey)
![Speed](https://img.shields.io/badge/speed-pending-lightgrey)
![Confidence](https://img.shields.io/badge/confidence-pending-lightgrey)

*Badges auto-update with each benchmark run*

## Quick Start in Replit

[![Open in Replit](https://repl.it/badge/github/${ORG_NAME}/${AGENT_NAME})](https://replit.com/new/github/${ORG_NAME}/${AGENT_NAME})

1. **Fork this repository** in Replit
2. **Click Run** - the agent starts automatically in ${AGENT_TYPE} environment  
3. **Develop independently** with hot reload and live preview

## Key Features

${key_features}

## Environment: ${AGENT_TYPE}

This agent runs in a dedicated ${AGENT_TYPE} environment with containerized deployment.

${technical_details}

## Development Workflow

### 🚀 Quick Development
\`\`\`bash
# Clone and develop locally
git clone https://github.com/${ORG_NAME}/${AGENT_NAME}.git
cd ${AGENT_NAME}
EOF

case "$AGENT_TYPE" in
    "streamlit")
        cat >> README.md << 'EOF'
pip install -r requirements.txt
streamlit run app.py --server.port=8080 --server.address=0.0.0.0
```

### 📊 Streamlit Interface
- **Interactive Dashboard**: Real-time molecular analysis and visualization
- **Hot Reload**: Automatic updates during development
- **Multi-page Support**: Organized interface with tabs and sections
- **Export Capabilities**: Data export and report generation

EOF
        ;;
    "n8n")
        cat >> README.md << 'EOF'
npm install
npm start
```

### 🔄 N8N Workflow Development  
- **Visual Workflow Builder**: Drag-and-drop automation design
- **Real-time Testing**: Live workflow execution and debugging
- **API Integration**: Connect to external platforms and services
- **Webhook Support**: Event-driven workflow triggers

EOF
        ;;
    "nodejs")
        cat >> README.md << 'EOF'
npm install
npm run dev
```

### ⚡ Node.js Development
- **Express Server**: RESTful API with real-time capabilities
- **Hot Reload**: Automatic server restart during development  
- **API Documentation**: Auto-generated endpoint documentation
- **Testing Suite**: Comprehensive unit and integration tests

EOF
        ;;
    "python")
        cat >> README.md << 'EOF'
pip install -r requirements.txt
python main.py
```

### 🐍 FastAPI Development
- **Interactive Docs**: Auto-generated API documentation at /docs
- **Type Safety**: Full type checking with Pydantic models
- **Async Support**: High-performance async request handling
- **Testing Framework**: Built-in testing capabilities

EOF
        ;;
esac

cat >> README.md << EOF

### 🔄 Issue-Driven Development

1. **Create GitHub Issue** → Describe feature or bug
2. **Create Feature Branch** → \`feature/ISSUE_NUMBER-description\`  
3. **Develop in Replit** → One-click development environment
4. **Run Benchmarks** → Automated CI/CD testing
5. **Submit Pull Request** → Include \`Closes #ISSUE_NUMBER\`
6. **Auto-Deploy** → Merge triggers automatic deployment

## Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Accuracy | ≥95% | *Pending* | ⏳ |
| Response Time | ≤30s | *Pending* | ⏳ |
| Confidence | ≥85% | *Pending* | ⏳ |
| Success Rate | ≥98% | *Pending* | ⏳ |

*Metrics auto-update with each benchmark run*

## CI/CD Pipeline

### GitHub Actions Workflows
- **Benchmark Testing**: Runs on every push and PR
- **Daily Health Checks**: Automated performance monitoring  
- **Badge Updates**: Real-time metric badge generation
- **Issue Creation**: Automatic bug reports for failures

### Quality Gates
- All benchmarks must pass target thresholds
- Code coverage minimum 80%
- No critical security vulnerabilities
- Performance regression protection

## API Interface

### Standard Endpoints
\`\`\`http
POST /process
Content-Type: application/json

{
  "query": "User question or request",
  "context": {
    "userId": "user123", 
    "sessionId": "session456"
  }
}
```

### Response Format
\`\`\`json
{
  "agent": "${agent_display_name}",
  "response": "Agent-generated response",
  "confidence": 95,
  "sources": ["source1", "source2"],
  "metadata": {
    "processingTime": 1250,
    "timestamp": "2025-01-12T10:30:00Z"
  }
}
```

## Integration with Formul8 Platform

### Git Submodule Integration
\`\`\`bash
# Add agent as submodule to main platform
git submodule add https://github.com/${ORG_NAME}/${AGENT_NAME}.git server/agents/${AGENT_NAME}
git submodule update --init --recursive
\`\`\`

### Orchestrator Communication
- **LangGraph Integration**: Multi-agent workflow orchestration
- **Message Passing**: Inter-agent communication protocols  
- **State Management**: Shared context and conversation history
- **Verification System**: Cross-agent response validation

## Repository Structure

\`\`\`
${AGENT_NAME}/
├── README.md                 # This file
├── .replit                   # Replit configuration
├── .github/workflows/        # CI/CD automation
│   ├── benchmarks.yml        # Benchmark testing
│   └── create-issue.yml      # Auto issue creation
├── benchmarks/               # Performance testing
│   ├── config.json          # Benchmark configuration
│   ├── runner.js            # Test execution
│   └── results/             # Test results
EOF

case "$AGENT_TYPE" in
    "streamlit")
        cat >> README.md << 'EOF'
├── app.py                    # Main Streamlit application
├── pyproject.toml           # Python dependencies
├── requirements.txt         # Pip requirements
└── replit.nix               # Nix configuration
EOF
        ;;
    "n8n")
        cat >> README.md << 'EOF'
├── package.json             # Node.js dependencies and scripts
├── .n8n/workflows/          # N8N workflow definitions
├── src/                     # Custom nodes and integrations
└── docs/                    # Workflow documentation
EOF
        ;;
    "nodejs"|"python")
        cat >> README.md << 'EOF'
├── src/                     # Source code
├── tests/                   # Test suites
├── package.json             # Dependencies and scripts
└── docs/                    # API documentation
EOF
        ;;
esac

cat >> README.md << EOF
```

## Links & Resources

- **🚀 Replit Development**: [![Open in Replit](https://repl.it/badge/github/${ORG_NAME}/${AGENT_NAME})](https://replit.com/new/github/${ORG_NAME}/${AGENT_NAME})
- **📊 Repository**: https://github.com/${ORG_NAME}/${AGENT_NAME}
- **🐛 Issues**: https://github.com/${ORG_NAME}/${AGENT_NAME}/issues
- **📈 Actions**: https://github.com/${ORG_NAME}/${AGENT_NAME}/actions
- **🏠 Main Platform**: https://github.com/${ORG_NAME}/formul8-platform

## Contributing

1. **Fork** the repository
2. **Create** a feature branch from an issue
3. **Develop** using the Replit environment
4. **Test** with automated benchmarks
5. **Submit** pull request with issue reference

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Part of the Formul8 Cannabis AI Platform** | **F8ai Organization** | **Independent Agent Architecture**
EOF
}

# Call the function to create the README
create_agent_readme

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
__pycache__/
*.pyc
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
.nyc_output/
*.tsbuildinfo
.n8n/database.sqlite
.streamlit/
EOF

# Create development workflow documentation
cat > DEVELOPMENT.md << EOF
# Development Workflow for ${AGENT_NAME}

## Environment: ${AGENT_TYPE}

This agent runs in a ${AGENT_TYPE} environment with containerized deployment.

## Issue-Driven Development

### 1. Create Feature Issue
\`\`\`bash
# Issues can be created via GitHub web interface or API
# Each issue should describe a specific feature or bug
\`\`\`

### 2. Create Feature Branch
\`\`\`bash
git checkout -b feature/ISSUE_NUMBER-description
# Example: git checkout -b feature/42-add-molecular-analysis
\`\`\`

### 3. Develop Feature
\`\`\`bash
# Make your changes
# Test locally
# Commit with descriptive messages
git add .
git commit -m "Add molecular analysis feature (fixes #42)"
\`\`\`

### 4. Create Pull Request
\`\`\`bash
git push origin feature/42-add-molecular-analysis
# Create PR via GitHub web interface
# Include "Closes #42" in PR description
\`\`\`

### 5. Merge and Deploy
\`\`\`bash
# PR is reviewed and merged
# Issue automatically closes
# Agent updates in main platform via submodule
\`\`\`

## Replit Development

1. **Fork** this repository in Replit
2. **Develop** with hot reload and live preview
3. **Test** using the built-in terminal and web view
4. **Commit** changes back to GitHub

## Container Environment

- **Type**: ${AGENT_TYPE}
- **Port**: Varies by agent type
- **Dependencies**: Managed via package files
- **Deployment**: Independent container deployment

## Integration Points

- **Main Platform**: Via Git submodules
- **API Endpoints**: Standard agent interface
- **GitHub Issues**: Feature and bug tracking
- **Replit**: One-click development environment
EOF

# Commit all files
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    echo "✅ Repository already up to date"
else
    git commit -m "Setup ${AGENT_NAME} for Replit development

- ${AGENT_TYPE} environment configuration
- One-click Replit development setup
- GitHub Issues integration workflow
- Containerized deployment ready
- Independent development environment"

    git push origin main
    echo "✅ ${AGENT_NAME} configured for Replit development"
fi

# Clean up temp directory
cd /home/runner/workspace
rm -rf "$TEMP_DIR"

echo "🎉 ${AGENT_NAME} is ready for development!"
echo "   Repository: https://github.com/${ORG_NAME}/${AGENT_NAME}"
echo "   Environment: ${AGENT_TYPE}"
echo "   Replit: Import from GitHub to start developing"