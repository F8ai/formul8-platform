#!/usr/bin/env node

// Optimized production start script
// Uses tsx runtime instead of compiled binaries for Cloud Run compatibility

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Formul8 AI Platform in production mode...');
console.log('🔧 Using tsx runtime for optimal Cloud Run compatibility');

// Set production environment
process.env.NODE_ENV = 'production';

// Start server with tsx
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
