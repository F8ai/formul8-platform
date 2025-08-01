#!/usr/bin/env node

// Optimized production startup for Replit deployment
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Production environment setup
process.env.NODE_ENV = 'production';
process.env.REPLIT_DEPLOYMENT = 'true';

console.log('🚀 Starting Formul8 Platform (Production)');
console.log('📦 Optimized for deployment');

// Start with memory optimization
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
  }
});

// Graceful shutdown handlers
const shutdown = (signal) => {
  console.log(`
🛑 Received ${signal}, shutting down gracefully...`);
  server.kill(signal);
  setTimeout(() => process.exit(0), 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.on('exit', (code) => {
  console.log(`🏁 Server exited with code ${code}`);
  process.exit(code);
});