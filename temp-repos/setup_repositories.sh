#!/bin/bash

# Setup script for temp repositories
# This script helps set up the temp repositories as proper GitHub repositories

echo "Setting up temp repositories as GitHub repositories..."

# Function to setup a repository
setup_repository() {
    local repo_name=$1
    local repo_path=$2
    
    echo "Setting up $repo_name..."
    
    if [ -d "$repo_path" ]; then
        cd "$repo_path"
        
        # Check if it's a git repository
        if [ -d ".git" ]; then
            echo "  ✓ $repo_name is already a git repository"
            
            # Check if remote is configured
            if git remote -v | grep -q origin; then
                echo "  ✓ Remote origin is already configured"
            else
                echo "  ⚠ No remote origin configured"
                echo "  Please run: git remote add origin https://github.com/F8ai/$repo_name.git"
                echo "  Then: git push -u origin main"
            fi
        else
            echo "  ✗ $repo_name is not a git repository"
        fi
        
        cd - > /dev/null
    else
        echo "  ✗ Directory $repo_path does not exist"
    fi
    
    echo ""
}

# Setup each repository
setup_repository "metabolomics-data" "metabolomics-data"
setup_repository "metabolomics-agent" "metabolomics-agent"
setup_repository "base-agent" "base-agent"

echo "Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Create GitHub repositories for each repo if they don't exist"
echo "2. Add remote origin to each repository:"
echo "   git remote add origin https://github.com/F8ai/REPO_NAME.git"
echo "3. Push each repository:"
echo "   git push -u origin main"
echo "4. Add as submodules to the main platform:"
echo "   git submodule add https://github.com/F8ai/REPO_NAME.git agents/REPO_NAME" 