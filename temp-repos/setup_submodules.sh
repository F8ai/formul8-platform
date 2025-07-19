#!/bin/bash

# Setup script for adding temp repositories as submodules
# Run this after creating the GitHub repositories

echo "Setting up submodules for formul8-platform..."

# Go to main platform directory
cd /Users/danielmcshan/GitHub/formul8-platform

echo "Current directory: $(pwd)"

# Function to add submodule
add_submodule() {
    local repo_name=$1
    local submodule_path=$2
    local github_url="https://github.com/F8ai/$repo_name.git"
    
    echo "Adding $repo_name as submodule at $submodule_path..."
    
    # Check if submodule already exists
    if [ -d "$submodule_path" ]; then
        echo "  ⚠ Directory $submodule_path already exists"
        echo "  Removing existing directory..."
        rm -rf "$submodule_path"
    fi
    
    # Add submodule
    git submodule add "$github_url" "$submodule_path"
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Successfully added $repo_name as submodule"
    else
        echo "  ✗ Failed to add $repo_name as submodule"
        return 1
    fi
    
    echo ""
}

# Add each repository as submodule
echo "Adding metabolomics-data as submodule..."
add_submodule "metabolomics-data" "data/metabolomics-data"

echo "Adding metabolomics-agent as submodule..."
add_submodule "metabolomics-agent" "agents/metabolomics-agent"

echo "Adding base-agent as submodule..."
add_submodule "base-agent" "agents/base-agent"

# Commit the changes
echo "Committing submodule changes..."
git add .gitmodules
git add data/metabolomics-data
git add agents/metabolomics-agent
git add agents/base-agent

git commit -m "Add metabolomics-data, metabolomics-agent, and base-agent as submodules

- Add metabolomics-data with PlantCyc integration and genome search
- Add metabolomics-agent for analysis and interpretation
- Add base-agent as template for all agents
- Update .gitmodules configuration"

echo "✓ Submodule setup complete!"
echo ""
echo "Next steps:"
echo "1. Push the changes: git push origin main"
echo "2. Verify submodules: git submodule status"
echo "3. Update submodules: git submodule update --init --recursive" 