#!/bin/bash
# Deployment start script - uses tsx instead of esbuild
export NODE_ENV=production
echo "🚀 Starting Formul8 Platform in production mode..."
exec npx tsx server/index.ts
