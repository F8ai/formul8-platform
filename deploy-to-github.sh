#!/bin/bash

# Formul8 Platform GitHub Deployment Script
# Deploys the complete formul8-platform to https://github.com/F8ai/formul8-platform

echo "🚀 Deploying Formul8 Platform to GitHub..."

# Set GitHub repository URL
GITHUB_REPO="https://github.com/F8ai/formul8-platform.git"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add GitHub remote (or update if exists)
echo "🔗 Setting GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin $GITHUB_REPO

# Stage all files
echo "📦 Staging all files..."
git add .

# Create commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Creating commit: 'Formul8 Platform - $TIMESTAMP'"
git commit -m "Formul8 Platform - Federated Agent Architecture Implementation - $TIMESTAMP

✅ Features Complete:
- Comprehensive federated agent network design (/federated page)
- 10 specialized AI agents for cannabis industry
- Multi-agent orchestration with LangGraph
- Real-time performance metrics and baseline assessment
- Google Workspace integration with automated document creation
- Use case demonstrations and agent collaboration scenarios
- Enterprise deployment options with Docker configurations
- Security framework with mTLS and certificate-based auth
- Production-ready TypeScript/React platform

Repository: formul8-platform
Organization: F8ai
Architecture: Federated Agent Network (f8.company.com ↔ formul8.ai)"

# Set main branch
git branch -M main

# Push to GitHub
echo "⬆️  Pushing to GitHub: $GITHUB_REPO"
echo "📋 You may need to provide your GitHub credentials..."
git push -u origin main --force

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Repository URL: $GITHUB_REPO"
echo "📁 Platform Structure:"
echo "   ├── agents/           # All 10 AI agents"
echo "   ├── client/           # React frontend"
echo "   ├── server/           # Express backend"
echo "   ├── shared/           # Common schemas & utilities"
echo "   ├── docs/             # Documentation"
echo "   └── local-deployment/ # Federated deployment configs"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit: $GITHUB_REPO"
echo "2. Configure repository settings and team access"
echo "3. Set up GitHub Actions for CI/CD"
echo "4. Configure secrets for deployment"
echo ""