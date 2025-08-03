# Execute Frontend Submodule Setup

## Ready-to-Execute Commands

Copy and paste these commands in order. Each section builds on the previous one.

### Step 1: Create GitHub Repository
```bash
# Go to https://github.com/F8ai and create new repository:
# - Name: formul8-frontend
# - Public repository
# - DO NOT initialize with README, .gitignore, or license
```

### Step 2: Convert Client to Git Repository
```bash
# Navigate to client directory
cd client

# Initialize as git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial frontend commit - extracted from formul8-platform"

# Add remote repository
git remote add origin https://github.com/F8ai/formul8-frontend.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Convert to Submodule
```bash
# Return to root directory
cd ..

# Remove client from main repository tracking
git rm -r client

# Commit the removal
git commit -m "Remove client directory - preparing for submodule conversion"

# Add as submodule
git submodule add https://github.com/F8ai/formul8-frontend.git client

# Commit the submodule addition
git commit -m "Add formul8-frontend as submodule at /client"
```

### Step 4: Initialize and Verify
```bash
# Initialize submodules
git submodule init

# Update submodules
git submodule update

# Check status
git submodule status

# Test that build still works
npm run build
```

### Step 5: Update .gitmodules (if needed)
The submodule should be automatically added to `.gitmodules`. Verify it contains:
```ini
[submodule "client"]
        path = client
        url = https://github.com/F8ai/formul8-frontend.git
```

## Verification Commands
```bash
# Check submodule status
git submodule status

# Check git status
git status

# Verify build works
npm run dev
```

## Future Workflow for Frontend Changes
```bash
# Make frontend changes
cd client
# ... make changes ...
git add .
git commit -m "Frontend changes"
git push

# Update main repository to point to new frontend version
cd ..
git add client
git commit -m "Update frontend submodule"
git push
```

## Team Setup Commands
New team members will need to run:
```bash
git clone https://github.com/F8ai/formul8-platform.git
cd formul8-platform
git submodule update --init --recursive
```

## Rollback Plan (if needed)
If something goes wrong, you can restore from backup:
```bash
# Remove broken submodule
git submodule deinit client
git rm client
rm -rf .git/modules/client

# Restore from backup (you'd need to create this first)
cp -r client-backup client
git add client
git commit -m "Restore client directory from backup"
```

Execute these commands in order, and let me know if you encounter any issues!