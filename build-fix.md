# Build Failure Fix Documentation

## Problem Identified
The standard `npm run build` command fails with:
```
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
sh: line 1: /home/runner/workspace/node_modules/.bin/esbuild: cannot execute binary file: Exec format error
```

## Root Cause
The esbuild binary is incompatible with the deployment environment architecture.

## ✅ Working Solution
Use the custom deployment scripts that avoid esbuild entirely:

**Build Command:** `node deployment-build-command.js`
**Start Command:** `node deployment-start-command.js`

## Deployment Configuration
The .replit file currently uses:
```
[deployment]
build = ["npm", "run", "build"]  # FAILS - uses esbuild
run = ["npm", "run", "start"]    # FAILS - needs compiled code
```

**Recommended for Replit Deployment Settings:**
- Build Command: `node deployment-build-command.js`
- Start Command: `node deployment-start-command.js`

## Verification
Both custom deployment commands have been tested and work correctly:
- ✅ Frontend builds with Vite (1.65MB assets)
- ✅ Assets copied to server/public/
- ✅ tsx runtime execution verified
- ✅ Production environment configured
- ✅ Graceful shutdown handling

## Manual Override
If needed, run builds manually:
```bash
# Instead of: npm run build (FAILS)
node deployment-build-command.js

# Instead of: npm run start (FAILS)  
node deployment-start-command.js
```