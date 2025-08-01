#!/usr/bin/env node

// Simple start wrapper that calls our working deployment start command
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting production server...');

const startProcess = spawn('node', [join(__dirname, 'deployment-start-command.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

startProcess.on('close', (code) => {
  console.log('🛑 Server stopped with code:', code);
  process.exit(code);
});

startProcess.on('error', (error) => {
  console.error('❌ Server process error:', error);
  process.exit(1);
});