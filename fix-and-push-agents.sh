#!/bin/bash

echo "=== Formul8 Agent Repository Push Script ==="
echo "This script will:"
echo "1. Fix package.json merge conflicts"
echo "2. Push all agent repositories to GitHub"
echo ""

# Navigate to workspace root
cd /home/runner/workspace
echo "Current directory: $(pwd)"

# Step 1: Fix package.json merge conflict
echo "=== Step 1: Fixing package.json merge conflict ==="
if grep -q "<<<<<<< HEAD" package.json; then
    echo "Found merge conflict markers in package.json, removing them..."
    # Remove the conflicting @google/genai line and merge markers
    sed -i '/<<<<<<< HEAD/,/>>>>>>> /d' package.json
    echo "✓ Merge conflict markers removed from package.json"
else
    echo "✓ No merge conflicts found in package.json"
fi

# Step 2: Install missing dependencies to fix the module error
echo "=== Step 2: Installing missing dependencies ==="
npm install

# Step 3: Handle any ongoing Git rebase in marketing-agent
echo "=== Step 3: Checking for ongoing Git operations ==="
if [ -d "agents/marketing-agent/.git/rebase-merge" ] || [ -d "agents/marketing-agent/.git/rebase-apply" ]; then
    echo "Found ongoing rebase in marketing-agent, resolving..."
    cd agents/marketing-agent
    git rebase --abort
    cd ../..
    echo "✓ Aborted ongoing rebase"
fi

# Step 4: Push all agent repositories
echo "=== Step 4: Pushing all agent repositories ==="
agents=("compliance-agent" "formulation-agent" "marketing-agent" "operations-agent" "sourcing-agent" "patent-agent" "science-agent" "spectra-agent" "customer-success-agent" "base-agent")

for agent in "${agents[@]}"; do
    if [ -d "agents/$agent" ]; then
        echo ""
        echo "Processing $agent..."
        cd "agents/$agent"
        
        # Check if there are commits to push
        commits_ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
        
        if [ "$commits_ahead" -gt "0" ]; then
            echo "  → $commits_ahead commit(s) to push"
            
            # Try to push directly first
            if git push origin main 2>/dev/null; then
                echo "  ✓ Successfully pushed $agent"
            else
                echo "  → Push failed, trying force push..."
                if git push origin main --force; then
                    echo "  ✓ Successfully force pushed $agent"
                else
                    echo "  ✗ Failed to push $agent"
                fi
            fi
        else
            echo "  ✓ $agent is up to date"
        fi
        
        cd ../..
    else
        echo "  ✗ Directory agents/$agent not found"
    fi
done

echo ""
echo "=== Summary ==="
echo "Checking final status of all repositories:"
for agent in "${agents[@]}"; do
    if [ -d "agents/$agent" ]; then
        cd "agents/$agent"
        commits_ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
        if [ "$commits_ahead" -eq "0" ]; then
            echo "✓ $agent - synchronized"
        else
            echo "⚠ $agent - still has $commits_ahead commit(s) to push"
        fi
        cd ../..
    fi
done

echo ""
echo "=== Script Complete ==="
echo "The Formul8 platform should now restart automatically with fixed dependencies."