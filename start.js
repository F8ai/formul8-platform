#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Set production environment
process.env.NODE_ENV = 'production';

try {
  console.log('🚀 Starting Formul8 Platform in production mode...');
  
  // Check if dist/server/index.ts exists (copied from build)
  if (existsSync('dist/server/index.ts')) {
    console.log('📁 Starting with tsx from dist directory...');
    execSync('cd dist && npx tsx server/index.ts', { stdio: 'inherit' });
  } else if (existsSync('server/index.ts')) {
    console.log('📁 Starting with tsx from source directory...');
    execSync('npx tsx server/index.ts', { stdio: 'inherit' });
  } else {
    throw new Error('No server entry point found');
  }
  
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}