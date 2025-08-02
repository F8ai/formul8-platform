#!/usr/bin/env node

// Optimized build for Replit deployment using minimal Docker context
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting optimized deployment build...');
console.log('📦 Using minimal Docker context approach (8.0MB vs 6.5GB)');

// Step 1: Build optimized assets
console.log('Step 1: Building optimized production assets...');
const buildProcess = spawn('node', [join(__dirname, 'build-optimized.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Production assets built successfully');
    
    // Step 2: Create minimal Docker context
    console.log('Step 2: Creating minimal Docker context...');
    const contextProcess = spawn('./create-minimal-docker-context.sh', [], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    contextProcess.on('close', (contextCode) => {
      if (contextCode === 0) {
        console.log('✅ Minimal Docker context created (8.0MB)');
        console.log('🎯 Deployment ready - Docker will use minimal context only');
        process.exit(0);
      } else {
        console.error('❌ Docker context creation failed with code:', contextCode);
        process.exit(contextCode);
      }
    });
    
    contextProcess.on('error', (error) => {
      console.error('❌ Docker context process error:', error);
      process.exit(1);
    });
    
  } else {
    console.error('❌ Build failed with code:', code);
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});