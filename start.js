#!/usr/bin/env node

// Production startup script - forces minimal context execution
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Formul8 Platform (Production)');

// Check if we have the minimal context directory
const contextPath = join(__dirname, 'docker-build-context');
const distPath = join(contextPath, 'dist', 'index.js');

if (existsSync(distPath)) {
  console.log('✅ Using minimal context deployment (8.0MB)');
  console.log('📂 Running from:', distPath);
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '5000';
  
  // Start from the minimal context
  const startProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    cwd: contextPath,
    env: process.env
  });
  
  startProcess.on('close', (code) => {
    process.exit(code);
  });
  
  startProcess.on('error', (error) => {
    console.error('❌ Startup error:', error);
    process.exit(1);
  });
  
} else {
  console.error('❌ Minimal context not found!');
  console.error('Expected:', distPath);
  console.error('Run: node build-optimized.js && ./create-minimal-docker-context.sh');
  process.exit(1);
}