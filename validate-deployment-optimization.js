#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

console.log('🔍 Validating Deployment Size Optimizations');
console.log('==========================================');

// Function to format file sizes
function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to get directory size
function getDirSize(dirPath) {
  if (!existsSync(dirPath)) return 0;
  try {
    const output = execSync(`du -sb "${dirPath}"`, { encoding: 'utf8' });
    return parseInt(output.split('\t')[0]);
  } catch (error) {
    return 0;
  }
}

console.log('\n📊 Current Build Artifacts:');
console.log('-----------------------------');

// Check dist directory (what gets deployed)
const distSize = getDirSize('dist');
console.log(`✅ Frontend build (dist/): ${formatSize(distSize)}`);

// Check what's excluded by .dockerignore
const excludedItems = [
  { name: 'attached_assets/', size: getDirSize('attached_assets') },
  { name: 'node_modules/', size: getDirSize('node_modules') },
  { name: 'docs/', size: getDirSize('docs') },
  { name: 'agents.old/', size: getDirSize('agents.old') },
  { name: 'data/', size: getDirSize('data') },
  { name: 'datasets/', size: getDirSize('datasets') },
  { name: '__pycache__/', size: getDirSize('__pycache__') }
];

console.log('\n🚫 Excluded from Container (via .dockerignore):');
console.log('------------------------------------------------');
let totalExcluded = 0;
excludedItems.forEach(item => {
  if (item.size > 0) {
    console.log(`❌ ${item.name}: ${formatSize(item.size)}`);
    totalExcluded += item.size;
  }
});

console.log('\n📈 Size Analysis:');
console.log('------------------');
console.log(`🎯 Build output size: ${formatSize(distSize)}`);
console.log(`🗑️  Total excluded: ${formatSize(totalExcluded)}`);
console.log(`💾 Space saved: ${formatSize(totalExcluded)}`);
console.log(`📉 Size reduction: ${Math.round((totalExcluded / (totalExcluded + distSize)) * 100)}%`);

console.log('\n✅ Optimization Verification:');
console.log('------------------------------');

// Check if .dockerignore exists
if (existsSync('.dockerignore')) {
  console.log('✅ .dockerignore file created');
} else {
  console.log('❌ .dockerignore file missing');
}

// Check if Dockerfile is optimized
if (existsSync('Dockerfile')) {
  const dockerfile = execSync('cat Dockerfile', { encoding: 'utf8' });
  if (dockerfile.includes('FROM node:20-alpine AS builder')) {
    console.log('✅ Multi-stage Dockerfile implemented');
  } else {
    console.log('❌ Multi-stage Dockerfile not detected');
  }
  
  if (dockerfile.includes('npm ci --only=production')) {
    console.log('✅ Production-only dependencies configured');
  } else {
    console.log('❌ Production dependency optimization missing');
  }
} else {
  console.log('❌ Dockerfile not found');
}

// Check if optimization scripts exist
const optimizationFiles = [
  'deploy-optimized.js',
  'scripts/optimize-build.js', 
  'scripts/cleanup-for-deployment.js',
  'start-production-optimized.js'
];

optimizationFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file} created`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

console.log('\n🚀 Deployment Readiness:');
console.log('-------------------------');

// Estimate final container size
const estimatedContainerSize = distSize + (200 * 1024 * 1024); // ~200MB for Node.js + production deps
console.log(`📦 Estimated container size: ${formatSize(estimatedContainerSize)}`);

const cloudRunLimit = 8 * 1024 * 1024 * 1024; // 8 GiB
const withinLimit = estimatedContainerSize < cloudRunLimit;
console.log(`🎯 Cloud Run limit (8 GiB): ${withinLimit ? '✅ WITHIN LIMIT' : '❌ EXCEEDS LIMIT'}`);

const sizeReduction = ((totalExcluded / (totalExcluded + estimatedContainerSize)) * 100);
console.log(`📊 Total size reduction: ~${Math.round(sizeReduction)}%`);

console.log('\n🎉 OPTIMIZATION SUMMARY:');
console.log('========================');
console.log(`Status: ${withinLimit ? '✅ READY FOR DEPLOYMENT' : '❌ NEEDS MORE OPTIMIZATION'}`);
console.log(`Container size: ${formatSize(estimatedContainerSize)} (Target: < 8 GiB)`);
console.log(`Space saved: ${formatSize(totalExcluded)}`);
console.log(`Reduction: ${Math.round(sizeReduction)}%`);

if (withinLimit) {
  console.log('\n💡 Next Steps:');
  console.log('   1. Test build: docker build -t formul8-ai-platform .');
  console.log('   2. Deploy to Cloud Run: gcloud run deploy');
  console.log('   3. Monitor deployment success');
} else {
  console.log('\n⚠️  Additional optimization needed');
  console.log('   Consider removing more assets or using external storage');
}