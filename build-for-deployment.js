#!/usr/bin/env node

// Deployment-optimized build script that avoids esbuild binary issues
// Only builds the frontend with Vite, keeps backend as TypeScript

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

console.log('🚀 Building Formul8 Platform for deployment...');
console.log('🔧 Frontend: Vite build → static files');
console.log('🔧 Backend: TypeScript → tsx runtime (no binary compilation)');

try {
  // Build only the frontend (client)
  console.log('🎨 Building client with Vite...');
  execSync('vite build', { stdio: 'inherit' });

  // Copy static files to where server expects them
  console.log('📁 Setting up static file access for production...');
  if (existsSync('server/public')) {
    execSync('rm -rf server/public');
  }
  
  // Check if dist/public exists, if not use dist directly
  if (existsSync('dist/public')) {
    execSync('cp -r dist/public server/public');
  } else if (existsSync('dist')) {
    execSync('mkdir -p server/public');
    execSync('cp -r dist/* server/public/');
  } else {
    console.log('⚠️  No built frontend files found, continuing with backend-only setup');
  }

  // Create a deployment-ready start script
  const deploymentStartScript = `#!/bin/bash
# Deployment start script - uses tsx instead of esbuild
export NODE_ENV=production
echo "🚀 Starting Formul8 Platform in production mode..."
exec npx tsx server/index.ts
`;

  writeFileSync('start.sh', deploymentStartScript);
  execSync('chmod +x start.sh');

  // Create a simple Dockerfile for containerized deployments
  const dockerfile = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm install tsx
COPY . .
RUN npm run build:client || npm run build || vite build
EXPOSE 5000
CMD ["npx", "tsx", "server/index.ts"]
`;

  writeFileSync('Dockerfile', dockerfile);

  console.log('✅ Build completed successfully!');
  console.log('📦 Frontend built to dist/public/');
  console.log('🔧 Backend runs with tsx (no compilation needed)');
  console.log('🚀 Ready for deployment');
  console.log('');
  console.log('Deployment options:');
  console.log('• For Replit: Use "npx tsx server/index.ts" as start command');
  console.log('• For Docker: Use the generated Dockerfile');
  console.log('• For other platforms: Use start-production.js');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}