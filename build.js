#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🚀 Building Formul8 Platform for production...');

try {
  // Clean dist directory
  if (existsSync('dist')) {
    console.log('🧹 Cleaning dist directory...');
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Create dist directory
  mkdirSync('dist', { recursive: true });

  // Build client (frontend)
  console.log('🎨 Building client...');
  execSync('vite build', { stdio: 'inherit' });

  // Copy server files as-is (TypeScript will be run with tsx in production)
  console.log('📁 Copying server files...');
  cpSync('server', 'dist/server', { recursive: true });
  
  // Copy shared files
  if (existsSync('shared')) {
    console.log('📁 Copying shared files...');
    cpSync('shared', 'dist/shared', { recursive: true });
  }

  // Copy only essential configuration files
  const filesToCopy = ['tsconfig.json', 'vite.config.ts'];
  filesToCopy.forEach(file => {
    if (existsSync(file)) {
      cpSync(file, `dist/${file}`);
    }
  });

  // Create a production package.json for the dist directory
  const productionPackageJson = {
    "name": "formul8-platform-production",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "NODE_ENV=production tsx server/index.ts"
    },
    "dependencies": {
      "tsx": "^4.0.0"
    }
  };
  
  writeFileSync('dist/package.json', JSON.stringify(productionPackageJson, null, 2));

  console.log('✅ Build completed successfully!');
  console.log('📦 Ready for deployment with tsx runtime');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}