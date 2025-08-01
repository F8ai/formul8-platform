#!/usr/bin/env node

/**
 * Deployment Size Validation (No Docker Required)
 * Validates that the deployment will be under Cloud Run 8 GiB limit
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('📊 Validating deployment size for Cloud Run...\n');

// Function to format bytes
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to get directory size
function getDirSize(dirPath) {
  try {
    if (!existsSync(dirPath)) return 0;
    const result = execSync(`du -sb "${dirPath}" 2>/dev/null | cut -f1`, { encoding: 'utf8' });
    return parseInt(result.trim()) || 0;
  } catch (error) {
    return 0;
  }
}

try {
  console.log('📋 Cloud Run Deployment Size Analysis:');
  console.log('=' .repeat(50));

  // Analyze what will be included in Docker build
  const includePatterns = [
    { name: 'server/', required: true },
    { name: 'shared/', required: true },
    { name: 'client/', required: true },
    { name: 'package.json', required: true },
    { name: 'package-lock.json', required: false },
    { name: 'vite.config.ts', required: true },
    { name: 'tsconfig.json', required: true },
    { name: 'components.json', required: true },
    { name: 'drizzle.config.ts', required: true }
  ];

  let totalIncluded = 0;
  let missingRequired = [];

  includePatterns.forEach(({ name, required }) => {
    if (existsSync(name)) {
      const size = getDirSize(name);
      totalIncluded += size;
      console.log(`├── ${name}: ${formatBytes(size)}`);
    } else if (required) {
      missingRequired.push(name);
      console.log(`├── ${name}: ❌ MISSING (required)`);
    } else {
      console.log(`├── ${name}: ⚠️  Optional (not found)`);
    }
  });

  // Analyze excluded directories (showing space saved)
  console.log('\n📋 Large directories excluded (.dockerignore):');
  const excludedPatterns = [
    'attached_assets/',
    'node_modules/',
    'agents/',
    'agent-dir/',
    'data/',
    'docs/',
    'formul8-platform-complete.tar.gz'
  ];

  let totalExcluded = 0;
  excludedPatterns.forEach(name => {
    if (existsSync(name)) {
      const size = getDirSize(name);
      totalExcluded += size;
      console.log(`├── ${name}: ${formatBytes(size)} (excluded)`);
    }
  });

  // Calculate final estimates
  const nodeModulesEstimate = 100 * 1024 * 1024; // ~100MB for production dependencies
  const finalContainerEstimate = totalIncluded + nodeModulesEstimate;

  console.log('\n📊 Container Size Estimation:');
  console.log('=' .repeat(50));
  console.log(`├── Source files: ${formatBytes(totalIncluded)}`);
  console.log(`├── Production node_modules: ~${formatBytes(nodeModulesEstimate)}`);
  console.log(`├── Alpine Linux base: ~50MB`);
  console.log(`├── Estimated total: ${formatBytes(finalContainerEstimate)}`);
  console.log(`├── Cloud Run limit: 8 GB`);
  
  const limitBytes = 8 * 1024 * 1024 * 1024; // 8 GB
  const percentUsed = (finalContainerEstimate / limitBytes) * 100;
  
  console.log(`└── Usage: ${percentUsed.toFixed(2)}% of limit`);

  console.log('\n💾 Space Savings from Optimization:');
  console.log(`├── Files excluded: ${formatBytes(totalExcluded)}`);
  console.log(`└── Reduction: ${((totalExcluded / (totalExcluded + totalIncluded)) * 100).toFixed(1)}%`);

  // Validation checks
  console.log('\n✅ Deployment Validation Checks:');
  console.log('=' .repeat(50));

  if (missingRequired.length > 0) {
    console.log(`❌ Missing required files: ${missingRequired.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ All required files present');
  }

  if (finalContainerEstimate > limitBytes) {
    console.log(`❌ Estimated size ${formatBytes(finalContainerEstimate)} exceeds 8GB limit`);
    process.exit(1);
  } else {
    console.log(`✅ Estimated size ${formatBytes(finalContainerEstimate)} is under 8GB limit`);
  }

  if (!existsSync('server/public/index.html')) {
    console.log('❌ Frontend assets not built (run deployment script first)');
    process.exit(1);
  } else {
    console.log('✅ Frontend assets prepared');
  }

  if (!existsSync('Dockerfile.optimized')) {
    console.log('❌ Optimized Dockerfile not found');
    process.exit(1);
  } else {
    console.log('✅ Optimized Dockerfile available');
  }

  console.log('\n🚀 Deployment Status: READY FOR CLOUD RUN');
  console.log('💡 Use Dockerfile.optimized for deployment');

} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}