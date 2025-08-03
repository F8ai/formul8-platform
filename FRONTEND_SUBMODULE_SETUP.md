# Frontend Submodule Setup Guide

## Overview
Convert the current `/client` directory into a Git submodule to enable independent frontend development and deployment.

## Prerequisites
- GitHub repository access (F8ai organization)
- Git expertise for submodule operations

## Steps to Execute

### 1. Create Frontend Repository
```bash
# Create new repository on GitHub: https://github.com/F8ai/formul8-frontend
# This should be done through GitHub web interface or GitHub CLI
```

### 2. Prepare Current Client Directory
```bash
# Navigate to client directory
cd client

# Initialize as separate git repository
git init
git add .
git commit -m "Initial frontend commit - extracted from formul8-platform"

# Add remote and push
git remote add origin https://github.com/F8ai/formul8-frontend.git
git branch -M main
git push -u origin main
```

### 3. Remove Client Directory from Main Repo
```bash
# Navigate back to root
cd ..

# Remove client directory from main repository
git rm -r client
git commit -m "Remove client directory - preparing for submodule conversion"
```

### 4. Add Frontend as Submodule
```bash
# Add the new frontend repository as a submodule
git submodule add https://github.com/F8ai/formul8-frontend.git client

# Commit the submodule addition
git commit -m "Add formul8-frontend as submodule at /client"

# Update .gitmodules file with proper configuration
```

### 5. Update .gitmodules Configuration
Add the following to `.gitmodules`:
```ini
[submodule "client"]
        path = client
        url = https://github.com/F8ai/formul8-frontend.git
```

### 6. Verify Setup
```bash
# Check submodule status
git submodule status

# Initialize and update submodules
git submodule init
git submodule update

# Test that Vite still builds correctly
npm run build
```

## Benefits

### Development Benefits
- **Independent Development**: Frontend can be developed, tested, and deployed independently
- **Version Control**: Separate versioning for frontend and backend components
- **Team Collaboration**: Frontend team can work without affecting backend stability
- **CI/CD**: Separate build and deployment pipelines for frontend

### Architecture Benefits
- **Microservice Architecture**: Aligns with federated architecture described in replit.md
- **Deployment Flexibility**: Frontend can be deployed to CDN, separate hosting, or served statically
- **Technology Independence**: Frontend can evolve technologies without backend impact

### Repository Structure
```
formul8-platform/
├── client/                 # Frontend submodule (formul8-frontend repo)
├── server/                 # Backend Express application
├── agents/                 # AI agent submodules
│   ├── compliance-agent/   # Submodule
│   ├── formulation-agent/  # Submodule
│   └── ...
├── shared/                 # Shared types and utilities
└── scripts/               # Build and deployment scripts
```

## Vite Configuration
The current `vite.config.ts` already points to the client directory:
```typescript
root: path.resolve(import.meta.dirname, "client"),
resolve: {
  alias: {
    "@": path.resolve(import.meta.dirname, "client", "src"),
    // ...
  }
}
```

This configuration will continue to work seamlessly with the submodule setup.

## Notes
- After setup, team members will need to run `git submodule update --init --recursive` to get all submodules
- Frontend changes will require commits in both the frontend repo and the main platform repo
- The main platform's `package.json` scripts will continue to work unchanged