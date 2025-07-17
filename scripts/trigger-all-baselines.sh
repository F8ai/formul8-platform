#!/bin/bash

# Trigger baseline tests for all agent repositories

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ORG_NAME="F8ai"
AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "marketing-agent"
    "science-agent"
    "operations-agent"
    "sourcing-agent"
    "patent-agent"
    "spectra-agent"
    "customer-success-agent"
)

echo -e "${BLUE}🚀 Triggering baseline tests for all agents${NC}"

# Function to trigger workflow for an agent
trigger_agent_baseline() {
    local AGENT_NAME="$1"
    echo -e "\n${YELLOW}⚡ Triggering ${AGENT_NAME} baseline test${NC}"
    
    if [ -d "$AGENT_NAME" ]; then
        cd "$AGENT_NAME"
        
        # Check if we're in a git repository
        if git rev-parse --git-dir > /dev/null 2>&1; then
            # Try to trigger the workflow if gh CLI is available
            if command -v gh &> /dev/null; then
                gh workflow run baseline-tests.yml 2>/dev/null || echo -e "${YELLOW}⚠️ Could not trigger via gh CLI, workflow will run on next push${NC}"
            else
                echo -e "${YELLOW}⚠️ GitHub CLI not available, creating commit to trigger workflow${NC}"
                
                # Create a small change to trigger the workflow
                echo "# Baseline Test Trigger $(date)" >> .trigger_baseline
                git add .trigger_baseline || true
                git commit -m "🤖 Trigger baseline tests [$(date '+%Y-%m-%d %H:%M')]" || true
                git push origin main || echo -e "${YELLOW}⚠️ Push failed, but continuing...${NC}"
                rm -f .trigger_baseline
            fi
        else
            echo -e "${RED}❌ Not a git repository: ${AGENT_NAME}${NC}"
        fi
        
        cd ..
    else
        echo -e "${RED}❌ Agent directory not found: ${AGENT_NAME}${NC}"
    fi
}

# Trigger for all agents
for AGENT in "${AGENTS[@]}"; do
    trigger_agent_baseline "$AGENT"
done

echo -e "\n${GREEN}🎉 All baseline tests triggered!${NC}"
echo -e "${BLUE}💡 Check GitHub Actions tabs in each repository for progress${NC}"
echo -e "${BLUE}🔍 Badges will update automatically upon completion${NC}"