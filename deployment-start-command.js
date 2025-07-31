#!/usr/bin/env node

/**
 * Deployment start command that replaces 'npm run start'
 * Use this in Replit deployment settings: node deployment-start-command.js
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 [REPLIT DEPLOYMENT] Starting production server...');

// Production environment configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = 'production';

console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${NODE_ENV}`);

// Verify server file exists
const serverFile = join(__dirname, 'server', 'index.ts');
if (!existsSync(serverFile)) {
  console.error('❌ Server file not found:', serverFile);
  process.exit(1);
}

// Verify static assets exist
const staticDir = join(__dirname, 'server', 'public');
if (!existsSync(staticDir)) {
  console.error('❌ Static assets not found. Run build command first.');
  process.exit(1);
}

console.log('✅ Server file and static assets verified');

// Start server with tsx runtime (no binary compilation)
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV,
    PORT: PORT.toString()
  }
});

// Handle server process events
server.on('error', (error) => {
  console.error('❌ [REPLIT DEPLOYMENT] Failed to start server:', error.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.log(`🛑 [REPLIT DEPLOYMENT] Server terminated with signal: ${signal}`);
  } else {
    console.log(`🛑 [REPLIT DEPLOYMENT] Server exited with code: ${code}`);
  }
  process.exit(code || 0);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📡 [REPLIT DEPLOYMENT] Received SIGTERM, shutting down...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 [REPLIT DEPLOYMENT] Received SIGINT, shutting down...');
  server.kill('SIGINT');
});

console.log('✅ [REPLIT DEPLOYMENT] Production server starting with tsx runtime...');