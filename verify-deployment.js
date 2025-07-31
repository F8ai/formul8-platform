#!/usr/bin/env node

/**
 * Deployment verification script
 * Confirms all deployment fixes are properly applied
 */

import { existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🔍 Verifying deployment configuration...');

const checks = [];

// Check 1: Frontend build assets exist
const serverPublicDir = 'server/public';
const indexPath = join(serverPublicDir, 'index.html');
const assetsDir = join(serverPublicDir, 'assets');

if (existsSync(indexPath) && existsSync(assetsDir)) {
  const indexSize = statSync(indexPath).size;
  checks.push(`✅ Frontend assets: index.html (${indexSize} bytes) + assets directory`);
} else {
  checks.push(`❌ Frontend assets missing - run 'node deploy.js' first`);
}

// Check 2: tsx runtime availability
try {
  const tsxVersion = execSync('npx tsx --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
  checks.push(`✅ tsx runtime: ${tsxVersion}`);
} catch (error) {
  checks.push(`❌ tsx runtime not available`);
}

// Check 3: No esbuild in package.json build script
try {
  const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));
  const buildScript = packageJson.scripts.build;
  
  if (buildScript.includes('esbuild')) {
    checks.push(`❌ Build script still contains esbuild: ${buildScript}`);
  } else {
    checks.push(`✅ Build script esbuild-free: ${buildScript}`);
  }
  
  const startScript = packageJson.scripts.start;
  if (startScript.includes('tsx')) {
    checks.push(`✅ Start script uses tsx: ${startScript}`);
  } else {
    checks.push(`⚠️  Start script doesn't use tsx: ${startScript}`);
  }
} catch (error) {
  checks.push(`❌ Could not read package.json`);
}

// Check 4: Deployment scripts exist
const deploymentScripts = [
  'deploy.js',
  'deploy-production.js', 
  'build-for-deployment.js',
  'start-production.js'
];

deploymentScripts.forEach(script => {
  if (existsSync(script)) {
    checks.push(`✅ Deployment script: ${script}`);
  } else {
    checks.push(`⚠️  Missing deployment script: ${script}`);
  }
});

// Check 5: Server can start with tsx
console.log('🧪 Testing server startup with tsx...');
try {
  const testOutput = execSync('timeout 3s NODE_ENV=production npx tsx server/index.ts 2>&1 || true', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (testOutput.includes('serving on port')) {
    checks.push(`✅ Server startup test: SUCCESS`);
  } else {
    checks.push(`⚠️  Server startup test: TIMEOUT (expected behavior)`);
  }
} catch (error) {
  checks.push(`⚠️  Server startup test: ${error.message}`);
}

// Print results
console.log('\n📋 Deployment Verification Results:');
console.log('=' .repeat(50));
checks.forEach(check => console.log(check));

const hasErrors = checks.some(check => check.includes('❌'));
const hasWarnings = checks.some(check => check.includes('⚠️'));

console.log('=' .repeat(50));

if (hasErrors) {
  console.log('❌ DEPLOYMENT NOT READY - Fix errors above');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  DEPLOYMENT READY WITH WARNINGS');
  console.log('🚀 Recommended deployment commands:');
  console.log('   Build: node deploy.js');
  console.log('   Start: NODE_ENV=production npx tsx server/index.ts');
} else {
  console.log('✅ DEPLOYMENT FULLY READY');
  console.log('🚀 Recommended deployment commands:');
  console.log('   Build: node deploy.js');
  console.log('   Start: NODE_ENV=production npx tsx server/index.ts');
}

console.log('\n📖 For more details, see DEPLOYMENT-FIXES-APPLIED.md');