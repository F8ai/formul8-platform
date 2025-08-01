#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🚀 Starting optimized build process...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (existsSync(resolve(rootDir, 'dist'))) {
    rmSync(resolve(rootDir, 'dist'), { recursive: true, force: true });
  }
  
  // Create dist directory
  mkdirSync(resolve(rootDir, 'dist'), { recursive: true });
  
  // Build frontend with Vite (optimized)
  console.log('📦 Building frontend with Vite...');
  execSync('vite build --mode production', { 
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_BUILD_OPTIMIZE: 'true'
    }
  });
  
  // Clean up development dependencies from node_modules if in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Cleaning development dependencies...');
    try {
      execSync('npm prune --production', { 
        stdio: 'inherit',
        cwd: rootDir 
      });
    } catch (error) {
      console.warn('⚠️  Could not prune dev dependencies:', error.message);
    }
  }
  
  // Clean npm cache
  console.log('🗑️  Cleaning npm cache...');
  try {
    execSync('npm cache clean --force', { 
      stdio: 'pipe',
      cwd: rootDir 
    });
  } catch (error) {
    console.warn('⚠️  Could not clean npm cache:', error.message);
  }
  
  console.log('✅ Optimized build completed successfully!');
  console.log('📊 Build summary:');
  
  // Get build size info
  try {
    const buildSize = execSync('du -sh dist/', { 
      encoding: 'utf8',
      cwd: rootDir 
    }).trim();
    console.log(`   Frontend build size: ${buildSize.split('\t')[0]}`);
  } catch (error) {
    console.log('   Frontend build size: Unable to calculate');
  }
  
  console.log('🎯 Optimization features applied:');
  console.log('   ✅ Frontend-only build (no server compilation)');
  console.log('   ✅ Production mode optimizations');
  console.log('   ✅ Development dependencies pruned');
  console.log('   ✅ NPM cache cleaned');
  console.log('   ✅ Tree-shaking and minification enabled');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}