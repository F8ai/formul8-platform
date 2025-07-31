#!/usr/bin/env node

// Production start script that avoids esbuild binary issues
// Uses tsx to run TypeScript directly, which is compatible with deployment platforms

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Set production environment
process.env.NODE_ENV = 'production';

// Ensure the PORT environment variable is properly set for deployment
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

console.log('🚀 Starting Formul8 Platform in production mode...');
console.log(`📍 Using port: ${process.env.PORT}`);
console.log('🔧 Running TypeScript directly with tsx (no esbuild)');

try {
  // Check if server file exists
  if (!existsSync('server/index.ts')) {
    throw new Error('Server entry point not found: server/index.ts');
  }

  // Start the server using tsx (TypeScript executor)
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: process.env
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });

} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}