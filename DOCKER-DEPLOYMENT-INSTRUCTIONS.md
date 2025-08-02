# Docker Deployment Instructions - Formul8 Platform

## Quick Start

```bash
# 1. Build optimized production assets
node build-optimized.js

# 2. Create minimal Docker context (8.0MB vs 11GB main directory)
./create-minimal-docker-context.sh

# 3. Build Docker image from minimal context
cd docker-build-context
docker build -t formul8-platform .

# 4. Run the container
docker run -p 5000:5000 -e DATABASE_URL=$DATABASE_URL formul8-platform
```

## Why Use Minimal Context?

The main project directory contains **11GB** of Replit environment files:
- `.cache/` (3.7GB pip cache)
- `.pythonlibs/` (5.5GB Python GPU libraries) 
- `.local/` (122MB local cache)

These are development artifacts that cause Docker builds to exceed size limits.

The `docker-build-context/` directory contains only **8.0MB** of essential files:
- Pre-built production assets (2.6MB)
- Source code (4.8MB)
- Configuration files (424KB)

## Production Deployment

### Option 1: Replit Deployments (Recommended)
```bash
# Use the optimized .replit.deploy configuration
# Automatically excludes large directories via deployment.ignore patterns
```

### Option 2: Manual Docker Build
```bash
# Always build from the minimal context directory
cd docker-build-context
docker build -t formul8-platform .
docker run -p 5000:5000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e NODE_ENV=production \
  formul8-platform
```

### Option 3: Cloud Platforms
```bash
# For Google Cloud Run, AWS App Runner, etc.
cd docker-build-context
docker build -t formul8-platform .
docker tag formul8-platform gcr.io/PROJECT-ID/formul8-platform
docker push gcr.io/PROJECT-ID/formul8-platform
```

## Health Checks

The Docker image includes health checks at `/api/health`:
```bash
# Test health endpoint
curl http://localhost:5000/api/health
```

## Troubleshooting

### "Docker context exceeds size limit"
- **Cause**: Building from main directory (11GB) instead of minimal context (8.0MB)
- **Solution**: Always use `cd docker-build-context && docker build`

### "Missing dependencies"
- **Cause**: Minimal context excludes node_modules 
- **Solution**: Docker installs dependencies via `npm ci` during build

### "Build failures"
- **Cause**: Pre-built assets missing
- **Solution**: Run `node build-optimized.js` before creating context

## File Structure

```
docker-build-context/           # 8.0MB total
├── dist/                      # 2.6MB - Pre-built production assets
├── server/                    # 3.2MB - Backend source code
├── client/                    # 1.8MB - Frontend source code  
├── shared/                    # 96KB - Shared utilities
├── package.json               # 4.2KB - Dependencies
├── package-lock.json          # 424KB - Lock file
├── Dockerfile                 # 874B - Optimized build instructions
└── .dockerignore             # 94B - Exclusion rules
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`

Optional:
- `PORT=5000` (default)
- Agent-specific API keys (see `.env.example`)