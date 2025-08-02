#!/usr/bin/env node
// Ultra-simple deployment that works around Replit Python detection

console.log('🚀 Simple Node.js deployment starting...');

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Just build and copy what we need
async function simpleDeploy() {
  console.log('📦 Running minimal build...');
  
  // Build frontend only
  const viteProcess = spawn('npx', ['vite', 'build', 'client'], {
    stdio: 'inherit'
  });
  
  viteProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend built successfully');
      console.log('🎯 Ready for simple deployment');
      process.exit(0);
    } else {
      console.log('❌ Frontend build failed');
      process.exit(1);
    }
  });
}

simpleDeploy().catch(console.error);