#!/bin/bash
# Frontend Submodule Setup Script
# Run this script to convert /client to a Git submodule

set -e

echo "🚀 Starting Frontend Submodule Setup..."

# Step 1: Create backup of current client directory
echo "📦 Creating backup of current client directory..."
cp -r client client-backup
echo "✅ Backup created at client-backup/"

# Step 2: Initialize client as separate git repository
echo "🔧 Initializing client as separate git repository..."
cd client
git init
git add .
git commit -m "Initial frontend commit - extracted from formul8-platform"

# Step 3: You need to create the GitHub repository first
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Go to https://github.com/F8ai"
echo "   2. Create new repository: 'formul8-frontend'"
echo "   3. Make it public"
echo "   4. DO NOT initialize with README, .gitignore, or license"
echo ""
read -p "Press Enter when you've created the GitHub repository..."

# Step 4: Add remote and push
echo "📤 Adding remote and pushing to GitHub..."
git remote add origin https://github.com/F8ai/formul8-frontend.git
git branch -M main
git push -u origin main

# Step 5: Return to root and remove client directory
echo "🗑️  Removing client directory from main repository..."
cd ..
git rm -r client
git commit -m "Remove client directory - preparing for submodule conversion"

# Step 6: Add frontend as submodule
echo "🔗 Adding formul8-frontend as submodule..."
git submodule add https://github.com/F8ai/formul8-frontend.git client
git commit -m "Add formul8-frontend as submodule at /client"

# Step 7: Verify setup
echo "✅ Verifying submodule setup..."
git submodule status
git submodule init
git submodule update

# Step 8: Test build
echo "🧪 Testing build process..."
if npm run build; then
    echo "✅ Build successful - setup complete!"
else
    echo "❌ Build failed - please check configuration"
    exit 1
fi

echo ""
echo "🎉 Frontend submodule setup complete!"
echo ""
echo "📋 Next steps for team members:"
echo "   git submodule update --init --recursive"
echo ""
echo "📋 For frontend development:"
echo "   cd client"
echo "   # Make changes"
echo "   git add ."
echo "   git commit -m 'Frontend changes'"
echo "   git push"
echo "   cd .."
echo "   git add client"
echo "   git commit -m 'Update frontend submodule'"
echo "   git push"