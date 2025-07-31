#!/usr/bin/env node

/**
 * Deployment build command that replaces 'npm run build'
 * Use this in Replit deployment settings: node deployment-build-command.js
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 [REPLIT DEPLOYMENT] Starting build process...');

try {
  // Step 1: Build frontend with Vite only (no esbuild server compilation)
  console.log('📦 Building frontend with Vite (no esbuild)...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  // Step 2: Create server/public directory
  const serverPublicDir = join(__dirname, 'server', 'public');
  if (!existsSync(serverPublicDir)) {
    mkdirSync(serverPublicDir, { recursive: true });
    console.log('📁 Created server/public directory');
  }
  
  // Step 3: Copy built frontend assets to server/public
  const distDir = join(__dirname, 'dist');
  if (existsSync(distDir)) {
    console.log('📋 Copying frontend assets to server/public...');
    copyDirectoryRecursive(distDir, serverPublicDir);
    console.log('✅ Frontend assets copied for deployment');
  }
  
  // Step 4: Verify tsx is available
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    console.log('✅ tsx runtime available for deployment');
  } catch (error) {
    console.error('⚠️  tsx not found - installing for deployment');
    execSync('npm install tsx', { stdio: 'inherit' });
  }
  
  console.log('🎉 [REPLIT DEPLOYMENT] Build completed successfully!');
  console.log('📋 Build Summary:');
  console.log('  ✅ Frontend built with Vite (no esbuild binary)');
  console.log('  ✅ Assets copied to server/public/');
  console.log('  ✅ Ready for tsx runtime execution');
  
} catch (error) {
  console.error('❌ [REPLIT DEPLOYMENT] Build failed:', error.message);
  process.exit(1);
}

function copyDirectoryRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const items = readdirSync(src);
  
  for (const item of items) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);
    
    if (statSync(srcPath).isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}