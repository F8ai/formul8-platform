#!/bin/bash

# Deployment cleanup script to reduce container size
echo "🧹 Starting deployment cleanup..."

# Remove development dependencies and build caches
echo "📦 Cleaning npm caches and dev dependencies..."
npm cache clean --force
rm -rf node_modules/.cache
rm -rf .npm
rm -rf .vite
rm -rf dist
rm -rf coverage

# Remove large asset directories
echo "🗑️  Removing large asset directories..."
rm -rf attached_assets
rm -rf docs
rm -rf agents.old
rm -rf data
rm -rf datasets
rm -rf dashboard
rm -rf flowise
rm -rf local-deployment
rm -rf __pycache__

# Remove build and deployment scripts
echo "🔧 Removing build and deployment scripts..."
rm -rf scripts/
rm -f *.tar.gz
rm -f *.zip
rm -f build-*.js
rm -f deploy-*.js
rm -f cleanup-*.sh
rm -f create-*.sh
rm -f *.py
rm -f baseline_requirements.txt

# Remove documentation and markdown files (keep essential ones)
echo "📄 Cleaning documentation files..."
find . -name "*.md" -not -name "README.md" -not -name "replit.md" -delete

# Remove log files and temporary files
echo "🗂️  Removing log and temporary files..."
find . -name "*.log" -delete
find . -name "*.tmp" -delete
find . -name "*.temp" -delete
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# Remove TypeScript build artifacts
echo "🏗️  Removing TypeScript build artifacts..."
find . -name "*.tsbuildinfo" -delete
find . -name "*.d.ts.map" -delete
find . -name "*.js.map" -delete

# Clean up node_modules (keep only production dependencies)
echo "📦 Optimizing node_modules for production..."
if [ -f package.json ]; then
    npm ci --only=production --prefer-offline --no-audit
fi

echo "✅ Deployment cleanup complete!"
echo "📊 Current directory size:"
du -sh . 2>/dev/null || echo "Unable to calculate size"