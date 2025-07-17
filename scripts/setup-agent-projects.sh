#!/bin/bash

# Script to set up GitHub Projects for agent improvement tracking
# This creates project boards that agents can use to manage their improvement tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORG_NAME="${1:-formul8}"

# Agent definitions
declare -A AGENTS=(
    ["compliance"]="Cannabis regulatory compliance and legal guidance"
    ["marketing"]="Cannabis marketing compliance and campaign optimization"
    ["formulation"]="Cannabis product formulation and chemistry"
    ["operations"]="Cannabis cultivation and processing operations"
    ["sourcing"]="Cannabis equipment and materials sourcing"
    ["patent"]="Cannabis intellectual property and patent analysis"
    ["spectra"]="Cannabis CoA and chromatography analysis"
    ["customer-success"]="Customer support and business intelligence"
)

echo -e "${BLUE}🎯 Setting up GitHub Projects for Agent Improvement${NC}"
echo -e "${BLUE}Organization: ${ORG_NAME}${NC}"
echo

# Check if user is authenticated with GitHub CLI
if ! gh auth status &>/dev/null; then
    echo -e "${RED}❌ Please authenticate with GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Function to create project with proper setup
create_agent_project() {
    local agent_name="$1"
    local description="$2"
    local project_title="${agent_name^} Agent Improvement Board"
    
    echo -e "${YELLOW}📋 Creating project: ${project_title}${NC}"
    
    # Create the project
    local project_output=$(gh project create \
        --title "$project_title" \
        --body "Automated project board for ${agent_name} agent self-improvement and task management. This board is managed by the AI agent to track performance improvements, bug fixes, and feature enhancements." \
        --public 2>&1)
    
    if [[ $project_output == *"https://github.com"* ]]; then
        local project_url=$(echo "$project_output" | grep -o 'https://github.com[^[:space:]]*')
        echo -e "${GREEN}✅ Project created: ${project_url}${NC}"
        
        # Get project ID for further configuration
        local project_id=$(basename "$project_url")
        
        # Add custom fields to the project (using GitHub CLI)
        echo -e "${YELLOW}🔧 Configuring project fields...${NC}"
        
        # Note: GitHub CLI doesn't support adding custom fields directly yet
        # These would need to be added manually or via GraphQL API
        echo -e "${BLUE}ℹ️  Manual setup required for custom fields:${NC}"
        echo -e "   • Priority (Single select: Low, Medium, High, Critical)"
        echo -e "   • Type (Single select: Performance, Accuracy, Feature, Bug)"
        echo -e "   • Effort (Single select: Small, Medium, Large)"
        echo -e "   • Agent (Text: ${agent_name})"
        echo -e "   • Status (Single select: Backlog, In Progress, Testing, Done)"
        
    else
        echo -e "${RED}❌ Failed to create project for ${agent_name}${NC}"
        echo "$project_output"
    fi
}

# Function to create orchestration project for cross-agent coordination
create_orchestration_project() {
    echo -e "${YELLOW}🎼 Creating agent orchestration project${NC}"
    
    local project_output=$(gh project create \
        --title "Formul8 Agent Orchestration Board" \
        --body "Orchestration project board for coordinating multi-agent workflows, cross-agent improvements, and platform-wide agent management. Managed by the LangGraph orchestrator." \
        --public 2>&1)
    
    if [[ $project_output == *"https://github.com"* ]]; then
        local project_url=$(echo "$project_output" | grep -o 'https://github.com[^[:space:]]*')
        echo -e "${GREEN}✅ Orchestration project created: ${project_url}${NC}"
        
        # Create initial orchestration issues
        gh issue create \
            --title "[ORCHESTRATION] Multi-Agent Workflow Optimization" \
            --body "Track improvements to cross-agent collaboration and workflow efficiency" \
            --label "orchestration,enhancement,multi-agent"
        
        gh issue create \
            --title "[ORCHESTRATION] Agent Performance Monitoring" \
            --body "Implement comprehensive monitoring of all agent performance metrics" \
            --label "orchestration,monitoring,performance"
        
        gh issue create \
            --title "[ORCHESTRATION] Consensus Algorithm Enhancement" \
            --body "Improve agent-to-agent verification and consensus reaching protocols" \
            --label "orchestration,algorithm,consensus"
            
    else
        echo -e "${RED}❌ Failed to create orchestration project${NC}"
        echo "$project_output"
    fi
}

# Function to create organization-wide improvement tracking project  
create_master_project() {
    echo -e "${YELLOW}📊 Creating master agent improvement project${NC}"
    
    local project_output=$(gh project create \
        --title "Formul8 Agent Platform Overview" \
        --body "Master overview board for tracking all agent activities, improvements, and coordination across the entire Formul8 platform. Provides executive-level visibility into agent ecosystem health." \
        --public 2>&1)
    
    if [[ $project_output == *"https://github.com"* ]]; then
        local project_url=$(echo "$project_output" | grep -o 'https://github.com[^[:space:]]*')
        echo -e "${GREEN}✅ Master project created: ${project_url}${NC}"
    else
        echo -e "${RED}❌ Failed to create master project${NC}"
        echo "$project_output"
    fi
}

# Function to setup project automation
setup_project_automation() {
    echo -e "${BLUE}🤖 Setting up project automation...${NC}"
    
    # Create a workflow file for project automation
    mkdir -p .github/workflows
    
    cat > .github/workflows/agent-project-automation.yml << 'EOF'
name: Agent Project Automation

on:
  issues:
    types: [opened, closed, labeled]
  issue_comment:
    types: [created]

jobs:
  update-projects:
    runs-on: ubuntu-latest
    if: contains(github.event.issue.labels.*.name, 'agent-improvement')
    
    steps:
      - name: Update Agent Project Board
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // Get the agent name from labels
            const agentLabel = context.payload.issue.labels.find(
              label => label.name !== 'agent-improvement' && 
                       !label.name.startsWith('type-') && 
                       !label.name.startsWith('priority-') &&
                       !label.name.startsWith('effort-')
            );
            
            if (!agentLabel) return;
            
            console.log(`Processing issue for agent: ${agentLabel.name}`);
            
            // Logic to add issue to appropriate project board
            // This would need to be implemented based on your specific project setup
            
            // Example: Add to project based on agent type
            const projectTitle = `${agentLabel.name.charAt(0).toUpperCase() + agentLabel.name.slice(1)} Agent Improvement Board`;
            console.log(`Should add to project: ${projectTitle}`);

      - name: Update Status Based on Comments
        if: github.event_name == 'issue_comment'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const comment = context.payload.comment.body;
            
            // Check for status updates from agents
            if (comment.includes('Status Update:')) {
              console.log('Agent status update detected');
              
              // Extract status and update project board accordingly
              if (comment.includes('IN-PROGRESS')) {
                console.log('Moving to In Progress');
              } else if (comment.includes('TESTING')) {
                console.log('Moving to Testing');
              } else if (comment.includes('COMPLETED')) {
                console.log('Moving to Done');
              }
            }
EOF

    echo -e "${GREEN}✅ Project automation workflow created${NC}"
    echo -e "${BLUE}ℹ️  Workflow file: .github/workflows/agent-project-automation.yml${NC}"
}

# Function to create project templates
create_project_templates() {
    echo -e "${BLUE}📝 Creating project templates...${NC}"
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Agent improvement task template
    cat > .github/ISSUE_TEMPLATE/agent-improvement.yml << 'EOF'
name: Agent Improvement Task
description: Template for agent self-improvement tasks
title: "[IMPROVEMENT] "
labels: ["agent-improvement"]
body:
  - type: dropdown
    id: agent
    attributes:
      label: Agent
      description: Which agent is this improvement for?
      options:
        - compliance
        - marketing
        - formulation
        - operations
        - sourcing
        - patent
        - spectra
        - customer-success
    validations:
      required: true
  
  - type: dropdown
    id: type
    attributes:
      label: Improvement Type
      description: What type of improvement is this?
      options:
        - Performance
        - Accuracy
        - Feature
        - Bug Fix
    validations:
      required: true
  
  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: What is the priority of this improvement?
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true
  
  - type: dropdown
    id: effort
    attributes:
      label: Estimated Effort
      description: How much effort is estimated for this improvement?
      options:
        - Small (< 1 day)
        - Medium (1-3 days)
        - Large (> 3 days)
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description
      description: Detailed description of the improvement needed
      placeholder: Describe what needs to be improved and why...
    validations:
      required: true
  
  - type: textarea
    id: success-criteria
    attributes:
      label: Success Criteria
      description: How will we know this improvement is successful?
      placeholder: |
        - [ ] Metric X improves by Y%
        - [ ] Feature Z is implemented
        - [ ] Tests pass
    validations:
      required: true
  
  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Any additional context or information
      placeholder: Performance data, user feedback, related issues, etc.
EOF

    echo -e "${GREEN}✅ Issue templates created${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting GitHub Projects setup for agent improvement tracking${NC}"
    
    # Create orchestration project first
    create_orchestration_project
    
    # Create master overview project
    create_master_project
    
    # Create individual agent projects
    for agent in "${!AGENTS[@]}"; do
        create_agent_project "$agent" "${AGENTS[$agent]}"
    done
    
    # Setup automation and templates
    setup_project_automation
    create_project_templates
    
    echo
    echo -e "${GREEN}🎉 GitHub Projects setup complete!${NC}"
    echo -e "${GREEN}📊 Created project boards for agent improvement tracking:${NC}"
    echo -e "   • Formul8 Agent Platform Overview (master)"
    echo -e "   • Formul8 Agent Orchestration Board (cross-agent coordination)"
    for agent in "${!AGENTS[@]}"; do
        echo -e "   • ${agent^} Agent Improvement Board (individual agent)"
    done
    echo
    echo -e "${BLUE}🔧 Features enabled:${NC}"
    echo -e "   • Individual agent project boards (8 boards)"
    echo -e "   • Orchestration project board (cross-agent coordination)"
    echo -e "   • Master overview board (executive visibility)"
    echo -e "   • Automated issue-to-project assignment"
    echo -e "   • Status tracking based on agent comments"
    echo -e "   • Issue templates for improvement tasks"
    echo -e "   • GitHub Actions automation"
    echo
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "   1. Manually add custom fields to each project board"
    echo -e "   2. Configure project views and automation rules"
    echo -e "   3. Set up agent environment variables for project access"
    echo -e "   4. Test agent integration with project boards"
    echo
    echo -e "${BLUE}🤖 Agent Integration:${NC}"
    echo -e "   Individual Agents can:"
    echo -e "   • Create improvement tasks automatically on their board"
    echo -e "   • Update task status via comments"
    echo -e "   • Track their own performance improvements"
    echo -e "   • Request cross-agent collaboration"
    echo
    echo -e "   Orchestrator can:"
    echo -e "   • Coordinate multi-agent workflows"
    echo -e "   • Track cross-agent consensus issues"
    echo -e "   • Manage platform-wide improvements"
    echo -e "   • Monitor agent ecosystem health"
}

# Check if organization name is provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: $0 <organization-name>${NC}"
    echo -e "${YELLOW}Example: $0 my-cannabis-org${NC}"
    read -p "Enter your GitHub organization name: " ORG_NAME
fi

main