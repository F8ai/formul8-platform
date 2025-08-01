#!/usr/bin/env node

// Simple build wrapper that calls our working deployment build command
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting deployment build...');

const buildProcess = spawn('node', [join(__dirname, 'deployment-build-command.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Build failed with code:', code);
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});