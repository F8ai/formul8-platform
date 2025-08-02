#!/usr/bin/env node

// Test deployment readiness
console.log('🧪 Testing deployment configuration...');

import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testDeployment() {
  console.log('✓ Node.js version:', process.version);
  console.log('✓ Environment:', process.env.NODE_ENV || 'development');
  
  // Check required files
  const requiredFiles = [
    'package.json',
    'build-optimized.js',
    'docker-build-context/Dockerfile'
  ];
  
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      console.log(`✓ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
  
  // Test build
  try {
    console.log('🔨 Testing build...');
    const { stdout } = await execAsync('timeout 15s node build-optimized.js');
    console.log('✓ Build test completed');
  } catch (error) {
    console.log('❌ Build test failed:', error.message);
  }
  
  console.log('🚀 Deployment test complete');
}

testDeployment().catch(console.error);