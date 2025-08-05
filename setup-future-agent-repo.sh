#!/bin/bash

# Setup script for Future Agent repository
# This script creates the Future Agent as an independent repository that can be used as a submodule

set -e

AGENT_NAME="future-agent"
ORG_NAME="F8ai"
REPO_URL="https://github.com/${ORG_NAME}/${AGENT_NAME}.git"

echo "🚀 Setting up Future Agent repository for independent development"

# Navigate to the agent directory
cd "agents/${AGENT_NAME}"

# Check if git is already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
fi

# Add all files
echo "Adding files to git..."
git add .

# Create initial commit if none exists
if ! git log --oneline -1 &>/dev/null; then
    echo "Creating initial commit..."
    git commit -m "Initial Future Agent setup for Future4200.com scraping and indexing

Features:
- Web scraping Future4200.com forum content
- AI-powered content indexing with vector search
- Knowledge extraction and technique documentation
- Equipment and materials identification
- Expert identification and trend analysis
- Full TypeScript implementation with comprehensive types
- Playwright web scraping with rate limiting
- OpenAI embeddings and GPT-4 integration
- FAISS vector store for similarity search
- Comprehensive test suite and documentation
- Git submodule compatibility with Formul8 platform

Agent Capabilities:
- Knowledge Retrieval from Future4200
- Expert Identification
- Trend Analysis
- Content Summarization
- Cross-Reference Discussions
- Technique Documentation
- Equipment Recommendations
- Process Troubleshooting
- Community Insights

Technical Stack:
- TypeScript/Node.js runtime
- Playwright for web scraping
- OpenAI API for embeddings and chat
- LangChain for text processing
- FAISS for vector storage
- Natural language processing
- Rate limiting and ethical scraping
- Comprehensive error handling"
fi

echo "✅ Future Agent repository initialized"

# Instructions for GitHub setup
echo ""
echo "📋 Next Steps:"
echo "1. Create GitHub repository: https://github.com/new"
echo "   - Repository name: ${AGENT_NAME}"
echo "   - Organization: ${ORG_NAME}"
echo "   - Description: 'Future4200.com scraping and indexing agent for Formul8 cannabis AI platform'"
echo "   - Visibility: Public"
echo ""
echo "2. Add remote and push:"
echo "   git remote add origin ${REPO_URL}"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Add as submodule to main platform:"
echo "   cd ../../"
echo "   git submodule add ${REPO_URL} agents/${AGENT_NAME}"
echo "   git commit -m 'Add Future Agent as submodule'"
echo ""
echo "Repository: ${REPO_URL}"
echo "Local path: agents/${AGENT_NAME}"