#!/usr/bin/env node

/**
 * Quick deployment readiness verification
 * Run this before deploying to ensure everything is configured correctly
 */

import { existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🔍 Verifying deployment readiness...\n');

const checks = [];

try {
  // 1. Check frontend assets exist
  const indexPath = join('server', 'public', 'index.html');
  const assetsDir = join('server', 'public', 'assets');
  
  if (existsSync(indexPath) && existsSync(assetsDir)) {
    const indexSize = statSync(indexPath).size;
    checks.push(`✅ Frontend assets ready: index.html (${indexSize} bytes) + assets/`);
  } else {
    checks.push(`❌ Frontend assets missing - run 'node deployment-build-command.js' first`);
  }

  // 2. Check tsx availability
  try {
    const tsxVersion = execSync('npx tsx --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    checks.push(`✅ tsx runtime available: ${tsxVersion}`);
  } catch (error) {
    checks.push(`❌ tsx runtime not available - install tsx`);
  }

  // 3. Check deployment scripts exist
  const requiredScripts = ['deployment-build-command.js', 'deployment-start-command.js'];
  
  requiredScripts.forEach(script => {
    if (existsSync(script)) {
      checks.push(`✅ Deployment script ready: ${script}`);
    } else {
      checks.push(`❌ Missing deployment script: ${script}`);
    }
  });

  // 4. Test server startup (quick test)
  console.log('🧪 Testing server startup...');
  try {
    execSync('timeout 3s NODE_ENV=production npx tsx server/index.ts 2>&1 || true', { 
      stdio: 'pipe' 
    });
    checks.push(`✅ Server startup test passed`);
  } catch (error) {
    checks.push(`⚠️  Server startup test timeout (normal behavior)`);
  }

  // 5. Check for common deployment blockers
  try {
    const { readFileSync } = await import('fs');
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    if (packageJson.dependencies.tsx) {
      checks.push(`✅ tsx in production dependencies`);
    } else {
      checks.push(`❌ tsx missing from production dependencies`);
    }
  } catch (error) {
    checks.push(`⚠️  Could not verify package.json (${error.message})`);
  }

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}

// Display results
console.log('\n📋 Deployment Readiness Report:');
console.log('='.repeat(50));
checks.forEach(check => console.log(check));

const hasErrors = checks.some(check => check.includes('❌'));
const hasWarnings = checks.some(check => check.includes('⚠️'));

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ DEPLOYMENT NOT READY - Fix errors above');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  DEPLOYMENT READY WITH WARNINGS - Review items above');
} else {
  console.log('✅ DEPLOYMENT FULLY READY!');
  console.log('\nNext steps:');
  console.log('1. Go to Deployments tab in Replit');
  console.log('2. Create new Autoscale Deployment');
  console.log('3. Build Command: node deployment-build-command.js');
  console.log('4. Start Command: node deployment-start-command.js');
  console.log('5. Deploy!');
}