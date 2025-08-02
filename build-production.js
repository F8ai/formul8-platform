#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { build } from 'esbuild';

console.log('🚀 Building Formul8 Platform for Production...\n');

async function buildProduction() {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

try {
  // Step 1: Build frontend with Vite
  console.log('⚛️  Building frontend with Vite...');
  execSync('vite build', { stdio: 'inherit', cwd: process.cwd() });
  
  // Step 2: Build backend with esbuild
  console.log('🔧 Building backend with esbuild...');
  await build({
    entryPoints: ['server/index.ts'],
    platform: 'node',
    target: 'node18',
    packages: 'external',
    bundle: true,
    format: 'esm',
    outdir: 'dist',
    minify: true,
    sourcemap: false,
    metafile: true
  });

  // Step 3: Copy additional assets if needed
  console.log('📁 Copying server assets...');
  if (fs.existsSync('server/public')) {
    fs.cpSync('server/public', 'dist/public', { recursive: true, force: true });
  }

  // Step 4: Create start script
  console.log('📝 Creating start script...');
  const startScript = `#!/bin/bash
echo "🚀 Starting Formul8 Platform..."
exec node index.js
`;
  fs.writeFileSync('dist/start.sh', startScript);
  fs.chmodSync('dist/start.sh', '755');

  // Step 5: Create package.json for production
  const prodPackage = {
    name: "formul8-platform",
    version: "1.0.0",
    type: "module",
    main: "index.js",
    scripts: {
      "start": "node index.js"
    },
    engines: {
      "node": ">=18.0.0"
    }
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));

  // Step 6: Size analysis
  console.log('\n📊 Build Size Analysis:');
  const publicSize = execSync('du -sh dist/public 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
  const backendSize = execSync('du -sh dist/index.js 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
  const totalSize = execSync('du -sh dist 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
  
  console.log(`   Frontend: ${publicSize.split('\t')[0] || 'N/A'}`);
  console.log(`   Backend:  ${backendSize.split('\t')[0] || 'N/A'}`);
  console.log(`   Total:    ${totalSize.split('\t')[0] || 'N/A'}`);

  console.log('\n✅ Production build completed successfully!');
  console.log('\n🎯 Deployment-ready build created in ./dist/');
  console.log('   To start: cd dist && ./start.sh');
  console.log('   Or: cd dist && node index.js');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
}

// Run the build
buildProduction().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});