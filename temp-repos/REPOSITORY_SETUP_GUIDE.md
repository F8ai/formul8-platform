# Repository Setup Guide

## Overview
This guide helps you set up the temp repositories as proper GitHub repositories and add them as submodules to the main formul8-platform.

## Current Status
All temp repositories are git repositories with commits but no remote origins configured.

## Step 1: Create GitHub Repositories

### 1.1 Create metabolomics-data Repository
1. Go to https://github.com/F8ai
2. Click "New repository"
3. Repository name: `metabolomics-data`
4. Description: "Metabolomics data repository with genome data, metabolic networks, and PlantCyc integration"
5. Make it Public
6. Don't initialize with README (we already have content)
7. Click "Create repository"

### 1.2 Create metabolomics-agent Repository
1. Go to https://github.com/F8ai
2. Click "New repository"
3. Repository name: `metabolomics-agent`
4. Description: "Metabolomics analysis agent for gene interpretation and metabolic network analysis"
5. Make it Public
6. Don't initialize with README (we already have content)
7. Click "Create repository"

### 1.3 Create base-agent Repository
1. Go to https://github.com/F8ai
2. Click "New repository"
3. Repository name: `base-agent`
4. Description: "Base agent template for Formul8 agents"
5. Make it Public
6. Don't initialize with README (we already have content)
7. Click "Create repository"

## Step 2: Push Repositories to GitHub

### 2.1 Push metabolomics-data
```bash
cd temp-repos/metabolomics-data
git remote add origin https://github.com/F8ai/metabolomics-data.git
git push -u origin main
```

### 2.2 Push metabolomics-agent
```bash
cd temp-repos/metabolomics-agent
git remote add origin https://github.com/F8ai/metabolomics-agent.git
git push -u origin main
```

### 2.3 Push base-agent
```bash
cd temp-repos/base-agent
git remote add origin https://github.com/F8ai/base-agent.git
git push -u origin main
```

## Step 3: Add as Submodules to Main Platform

### 3.1 Add metabolomics-data as submodule
```bash
cd /Users/danielmcshan/GitHub/formul8-platform
git submodule add https://github.com/F8ai/metabolomics-data.git data/metabolomics-data
```

### 3.2 Add metabolomics-agent as submodule
```bash
cd /Users/danielmcshan/GitHub/formul8-platform
git submodule add https://github.com/F8ai/metabolomics-agent.git agents/metabolomics-agent
```

### 3.3 Add base-agent as submodule
```bash
cd /Users/danielmcshan/GitHub/formul8-platform
git submodule add https://github.com/F8ai/base-agent.git agents/base-agent
```

## Step 4: Commit Submodule Changes

```bash
cd /Users/danielmcshan/GitHub/formul8-platform
git add .gitmodules
git add data/metabolomics-data
git add agents/metabolomics-agent
git add agents/base-agent
git commit -m "Add metabolomics-data, metabolomics-agent, and base-agent as submodules"
git push origin main
```

## Step 5: Verify Setup

### 5.1 Check submodule status
```bash
git submodule status
```

### 5.2 Update submodules
```bash
git submodule update --init --recursive
```

## Repository Contents

### metabolomics-data
- **Dashboard**: Cytoscape-based metabolic network visualization
- **PlantCyc Integration**: Target metrics and progress tracking
- **Genome Data**: C. sativa and P. cubensis genome infrastructure
- **Scripts**: Download and analysis scripts for multiple databases
- **Data**: Organized genome and metabolic data structure

### metabolomics-agent
- **Agent Logic**: Metabolomics analysis and gene interpretation
- **Data Processing**: Genome annotation and metabolic pathway analysis
- **Integration**: Connects with metabolomics-data repository

### base-agent
- **Template**: Base agent structure for all Formul8 agents
- **Common Functionality**: Shared agent features and utilities

## Benefits of This Setup

1. **Modularity**: Each repository has a specific purpose
2. **Version Control**: Independent versioning for each component
3. **Collaboration**: Different teams can work on different repositories
4. **Deployment**: Can deploy agents and data independently
5. **Maintenance**: Easier to maintain and update individual components

## Troubleshooting

### If submodule push fails:
```bash
cd agents/metabolomics-agent
git push origin main
```

### If submodule update fails:
```bash
git submodule update --init --recursive --force
```

### If remote already exists:
```bash
git remote set-url origin https://github.com/F8ai/REPO_NAME.git
```

## Next Steps After Setup

1. **Update Documentation**: Update README files in each repository
2. **Set Up CI/CD**: Configure GitHub Actions for automated testing
3. **Configure Permissions**: Set up appropriate access controls
4. **Integration Testing**: Test the integration between repositories
5. **Deployment**: Deploy the updated platform with new submodules 