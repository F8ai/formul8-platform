#!/bin/bash

echo "🚀 PUSHING ALL AGENT SUBMODULES TO GITHUB"
echo "========================================"

# List of all agents
AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "marketing-agent"
    "operations-agent"
    "sourcing-agent"
    "patent-agent"
    "science-agent"
    "spectra-agent"
    "customer-success-agent"
)

# Function to push agent files
push_agent() {
    local agent=$1
    echo "📦 Pushing $agent..."
    
    cd "agents/$agent"
    
    # Push key agent files
    if [ -f "README.md" ]; then
        echo "  - README.md"
        gh api "repos/F8ai/$agent/contents/README.md" --method PUT \
            --raw-field message="Update $agent with latest configurations" \
            --raw-field content="$(base64 -w 0 README.md)" \
            --field sha="$(gh api "repos/F8ai/$agent/contents/README.md" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    if [ -f "agent_config.yaml" ]; then
        echo "  - agent_config.yaml"
        gh api "repos/F8ai/$agent/contents/agent_config.yaml" --method PUT \
            --raw-field message="Update agent configuration" \
            --raw-field content="$(base64 -w 0 agent_config.yaml)" \
            --field sha="$(gh api "repos/F8ai/$agent/contents/agent_config.yaml" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    if [ -f "baseline.json" ]; then
        echo "  - baseline.json"
        gh api "repos/F8ai/$agent/contents/baseline.json" --method PUT \
            --raw-field message="Update baseline questions" \
            --raw-field content="$(base64 -w 0 baseline.json)" \
            --field sha="$(gh api "repos/F8ai/$agent/contents/baseline.json" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    if [ -f "agent.py" ]; then
        echo "  - agent.py"
        gh api "repos/F8ai/$agent/contents/agent.py" --method PUT \
            --raw-field message="Update agent implementation" \
            --raw-field content="$(base64 -w 0 agent.py)" \
            --field sha="$(gh api "repos/F8ai/$agent/contents/agent.py" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    cd ../..
    echo "  ✅ $agent updated"
}

# Function to push data repository
push_data_repo() {
    local agent=$1
    echo "📊 Pushing $agent-data..."
    
    cd "agents/$agent/data"
    
    if [ -f "README.md" ]; then
        echo "  - README.md"
        gh api "repos/F8ai/$agent-data/contents/README.md" --method PUT \
            --raw-field message="Update data repository documentation" \
            --raw-field content="$(base64 -w 0 README.md)" \
            --field sha="$(gh api "repos/F8ai/$agent-data/contents/README.md" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    if [ -f ".gitattributes" ]; then
        echo "  - .gitattributes"
        gh api "repos/F8ai/$agent-data/contents/.gitattributes" --method PUT \
            --raw-field message="Configure Git LFS for large files" \
            --raw-field content="$(base64 -w 0 .gitattributes)" \
            --field sha="$(gh api "repos/F8ai/$agent-data/contents/.gitattributes" --jq '.sha' 2>/dev/null || echo '')" \
            > /dev/null 2>&1
    fi
    
    cd ../../..
    echo "  ✅ $agent-data updated"
}

# Push all agents
for agent in "${AGENTS[@]}"; do
    if [ -d "agents/$agent" ]; then
        push_agent "$agent"
        
        # Push data repository if it exists
        if [ -d "agents/$agent/data" ]; then
            push_data_repo "$agent"
        fi
        
        echo ""
    fi
done

echo "🎯 ALL SUBMODULES PUSHED SUCCESSFULLY"
echo "Total repositories updated: $((${#AGENTS[@]} * 2))"
echo "- ${#AGENTS[@]} agent repositories"
echo "- ${#AGENTS[@]} data repositories"