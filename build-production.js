#!/usr/bin/env node

// Clean production build for deployment
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

console.log('🚀 Building Formul8 Platform for Production...\n');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (existsSync('dist')) rmSync('dist', { recursive: true, force: true });
  if (existsSync('server/public')) rmSync('server/public', { recursive: true, force: true });
  
  // Step 2: Build frontend with optimizations
  console.log('📦 Building optimized frontend...');
  execSync('npx vite build --mode production --outDir dist/public', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  // Debug: Check what was actually built
  console.log('🔍 Checking build output...');
  execSync('find . -name "dist" -type d | head -5', { stdio: 'inherit' });
  execSync('find . -name "index.html" | grep -E "(dist|build)" | head -5', { stdio: 'inherit' });
  
  // Step 3: Copy frontend assets to server/public for runtime serving
  console.log('📋 Copying assets to server/public...');
  mkdirSync('server/public', { recursive: true });
  
  // Check multiple possible build output locations
  const buildLocations = [
    'dist/public',
    'client/dist/public',
    'client/dist', 
    'dist'
  ];
  
  let buildPath = null;
  for (const location of buildLocations) {
    if (existsSync(location) && existsSync(join(location, 'index.html'))) {
      buildPath = location;
      break;
    }
  }
  
  if (buildPath) {
    console.log(`  ✅ Found build output at: ${buildPath}`);
    execSync(`cp -r ${buildPath}/. server/public/`, { stdio: 'inherit' });
  } else {
    throw new Error(`Frontend build output not found. Checked: ${buildLocations.join(', ')}`);
  }
  
  // Step 4: Create production start script
  console.log('🔧 Creating production start configuration...');
  
  const startScript = `#!/bin/sh
# Production startup for Formul8 Platform
export NODE_ENV=production
export PORT=\${PORT:-5000}

echo "🚀 Starting Formul8 Platform on port $PORT..."
echo "📁 Serving static assets from server/public/"

# Start the server with tsx (no compilation needed)
exec npx tsx server/index.ts
`;

  writeFileSync('start.sh', startScript);
  execSync('chmod +x start.sh');
  
  // Step 5: Validate build output
  console.log('✅ Validating build output...');
  
  if (!existsSync('server/public/index.html')) {
    throw new Error('Server assets not copied properly');
  }
  
  // Verify build assets were copied correctly
  if (!existsSync('server/public/assets')) {
    throw new Error('Frontend assets directory not found in server/public/');
  }
  
  console.log('\n🎉 Production build completed successfully!');
  console.log('📊 Build Summary:');
  console.log('  ✅ Frontend built to dist/public/');
  console.log('  ✅ Assets copied to server/public/');
  console.log('  ✅ Production start script created');
  console.log('  ✅ Ready for deployment');
  
  console.log('\n🚀 Deployment Commands:');
  console.log('  • For Replit: Use "npx tsx server/index.ts"');
  console.log('  • For Docker: Use the Dockerfile in this directory');
  console.log('  • For manual: Run "./start.sh"');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}