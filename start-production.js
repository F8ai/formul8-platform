#!/usr/bin/env node

/**
 * Production server startup script
 * Uses tsx runtime instead of compiled code for Cloud Run compatibility
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production environment configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = 'production';

console.log('🚀 Starting Formul8 Platform in production mode...');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${NODE_ENV}`);

// Verify server file exists
const serverFile = join(__dirname, 'server', 'index.ts');
if (!existsSync(serverFile)) {
  console.error('❌ Server file not found:', serverFile);
  process.exit(1);
}

// Start server with tsx runtime
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
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.log(`🛑 Server terminated with signal: ${signal}`);
  } else {
    console.log(`🛑 Server exited with code: ${code}`);
  }
  process.exit(code || 0);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

console.log('✅ Production server starting with tsx runtime...');