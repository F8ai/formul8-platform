#!/usr/bin/env node

// Deployment script for Replit Deployments
// This script builds the app and starts it using tsx runtime

import { execSync } from 'child_process';

console.log('🚀 Replit Deployment Script');
console.log('============================');

try {
  // Step 1: Build the application
  console.log('📦 Building application...');
  execSync('node build-for-deployment.js', { stdio: 'inherit' });
  
  // Step 2: Start the server with tsx
  console.log('🚀 Starting server with tsx runtime...');
  console.log('Server will start on the PORT assigned by deployment environment');
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Start the server
  execSync('npx tsx server/index.ts', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}