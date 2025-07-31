# Replit Deployment Guide - Cannabis AI Platform

## 🚀 Quick Deployment Setup

Your cannabis industry AI platform is now ready for deployment on Replit! Follow these steps:

### Step 1: Access Deployments Tab
1. In your Replit interface, click on the **"Deployments"** tab
2. Click **"Create Deployment"** or **"+ New Deployment"**

### Step 2: Configure Deployment Settings

**Deployment Type:** Choose **"Autoscale Deployment"**

**Custom Build & Start Commands:**
```
Build Command: node deployment-build-command.js
Start Command: node deployment-start-command.js
```

### Step 3: Environment Variables (Optional)
If you need to add any production environment variables, set them in the deployment configuration:
- `NODE_ENV=production` (will be set automatically)
- `PORT=5000` (will be set automatically)
- Add any API keys if needed (OpenAI, etc.)

### Step 4: Deploy
1. Click **"Deploy"** 
2. Monitor the build logs to ensure successful deployment
3. Your app will be available at your assigned `.replit.app` domain

## ✅ What's Already Configured

### Build Process (`deployment-build-command.js`)
- ✅ Builds frontend with Vite (no esbuild binary issues)
- ✅ Copies assets to `server/public/`
- ✅ Installs tsx runtime for TypeScript execution
- ✅ Avoids problematic binary compilation

### Start Process (`deployment-start-command.js`)
- ✅ Uses tsx runtime for TypeScript execution
- ✅ Sets production environment
- ✅ Serves static files correctly
- ✅ Handles graceful shutdown

### Authentication & Database
- ✅ Development mode authentication bypass configured
- ✅ PostgreSQL database connection ready
- ✅ Demo user fallback for testing

## 🔧 Deployment Commands Explained

### Build Command: `node deployment-build-command.js`
This replaces the standard `npm run build` and:
- Runs `vite build` to compile the frontend
- Copies built assets to `server/public/`
- Ensures tsx is available for production
- Avoids esbuild binary execution that causes deployment failures

### Start Command: `node deployment-start-command.js`
This replaces `npm run start` and:
- Uses `npx tsx server/index.ts` for TypeScript execution
- Sets proper environment variables
- Provides graceful shutdown handling
- Serves static files from the correct location

## 🚨 Important Notes

1. **Don't use standard npm scripts** - Use the custom deployment commands above
2. **tsx is in production dependencies** - Required for TypeScript execution
3. **Frontend assets are pre-built** - Static files served from `server/public/`
4. **Authentication works in development mode** - Demo user provided automatically

## 🎯 Expected Results

After successful deployment:
- ✅ Cannabis AI platform accessible via `.replit.app` URL
- ✅ All agent metrics and dashboards working
- ✅ Real-time baseline testing functional
- ✅ Agent network visualization active
- ✅ GitHub integration operational
- ✅ Compliance tools accessible

## 🔍 Troubleshooting

If deployment fails:
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Ensure `tsx` is listed in production dependencies
4. Contact support if binary compatibility issues persist

Your deployment is fully configured and ready to go!