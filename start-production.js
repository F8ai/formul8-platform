#!/usr/bin/env node

/**
 * Production server startup script using tsx runtime
 * Replaces npm start to avoid esbuild binary compatibility issues
 * Use as start command: node start-production.js
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Set production environment
process.env.NODE_ENV = 'production';

console.log('🚀 Starting Formul8 Platform in production mode...');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT || '5000'}`);

// Verify server files exist
if (!existsSync('server/index.ts')) {
  console.error('❌ Server entry point not found: server/index.ts');
  process.exit(1);
}

// Verify static assets
const publicDir = 'server/public';
if (!existsSync(publicDir)) {
  console.warn('⚠️  Static assets not found in server/public/');
  console.warn('    Run "node deployment-production.js" first to build assets');
}

console.log('🔧 Using tsx runtime for TypeScript execution');
console.log('📁 Serving static assets from server/public/');
console.log('');

// Start server with tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  console.log(`📊 Server process exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});