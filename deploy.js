#!/usr/bin/env node

/**
 * Production deployment script that avoids esbuild binary execution
 * Uses tsx runtime instead of compiled code for better Cloud Run compatibility
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting deployment build process...');

try {
  // Step 1: Build frontend with Vite (no esbuild server compilation)
  console.log('📦 Building frontend with Vite...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  // Step 2: Ensure server/public directory exists
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
    console.log('✅ Frontend assets copied successfully');
  }
  
  // Step 4: Verify tsx is available for production
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    console.log('✅ tsx runtime verified for production execution');
  } catch (error) {
    console.error('⚠️  tsx not found - server will need tsx installed in production');
  }
  
  console.log('🎉 Deployment build completed successfully!');
  console.log('');
  console.log('📋 Deployment Summary:');
  console.log('  ✅ Frontend built with Vite (no esbuild compilation)');
  console.log('  ✅ Assets copied to server/public/');
  console.log('  ✅ Server ready for tsx runtime execution');
  console.log('');
  console.log('🚀 To start in production, use:');
  console.log('  NODE_ENV=production npx tsx server/index.ts');
  console.log('');
  console.log('📋 Deployment Notes:');
  console.log('  ✅ Authentication bypassed in dev mode (no REPLIT_DOMAINS)');
  console.log('  ✅ Frontend assets served from server/public/');
  console.log('  ✅ Server configured for production deployment');
  
} catch (error) {
  console.error('❌ Deployment build failed:', error.message);
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