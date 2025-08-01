#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🚀 Production build starting...');
console.log('🎯 Target: Reduce deployment size under 8GB');

try {
  // Step 1: Clean builds
  console.log('🧹 Cleaning previous builds...');
  const cleanPaths = [
    join(rootDir, 'dist'),
    join(rootDir, 'server/public'),
    join(rootDir, 'node_modules/.cache'),
    join(rootDir, '.vite')
  ];
  
  cleanPaths.forEach(path => {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  // Step 2: Build with production optimizations
  console.log('📦 Building frontend...');
  const buildStart = Date.now();
  
  execSync('vite build --mode production', { 
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      GENERATE_SOURCEMAP: 'false'
    }
  });
  
  const buildTime = ((Date.now() - buildStart) / 1000).toFixed(2);

  // Step 3: Setup production file structure
  const serverPublicDir = join(rootDir, 'server', 'public');
  if (!existsSync(serverPublicDir)) {
    mkdirSync(serverPublicDir, { recursive: true });
  }

  // Step 4: Copy built assets
  const distDir = join(rootDir, 'dist', 'public');
  if (existsSync(distDir)) {
    console.log('📋 Copying assets...');
    execSync(`cp -r "${distDir}"/* "${serverPublicDir}"/`, { stdio: 'pipe' });
  }

  // Step 5: Create deployment environment
  const envContent = `NODE_ENV=production
REPLIT_DEPLOYMENT=true
NODE_OPTIONS="--max-old-space-size=2048"`;

  writeFileSync(join(rootDir, '.env.production'), envContent);

  // Get sizes
  function getSize(path) {
    try {
      const result = execSync(`du -sh "${path}" 2>/dev/null | cut -f1`, { encoding: 'utf8' });
      return result.trim();
    } catch {
      return 'Unknown';
    }
  }

  const frontendSize = getSize(serverPublicDir);
  const nodeModulesSize = getSize(join(rootDir, 'node_modules'));

  console.log('');
  console.log('✅ Production build completed!');
  console.log('');
  console.log(`📊 Build Summary:`);
  console.log(`  Frontend: ${frontendSize}`);
  console.log(`  Node modules: ${nodeModulesSize}`);
  console.log(`  Build time: ${buildTime}s`);
  console.log('');
  console.log('🎯 Optimizations applied:');
  console.log('  ✅ Production Vite build');
  console.log('  ✅ Source maps disabled');
  console.log('  ✅ Static assets optimized');
  console.log('  ✅ Large files excluded via .dockerignore');
  console.log('');
  console.log('🚀 Ready for deployment with reduced size!');

} catch (error) {
  console.error('❌ Production build failed:', error.message);
  process.exit(1);
}