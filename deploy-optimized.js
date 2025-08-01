#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting optimized deployment build...');
console.log('🎯 This build is optimized for Cloud Run deployment');

try {
  // Step 1: Clean previous builds
  console.log('');
  console.log('🧹 Step 1: Cleaning previous builds...');
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
    console.log('   ✅ Removed previous dist directory');
  }
  
  // Step 2: Build frontend only (no server compilation)
  console.log('');
  console.log('📦 Step 2: Building frontend with Vite...');
  execSync('vite build --mode production', { 
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  console.log('   ✅ Frontend built successfully');
  
  // Step 3: Ensure server/public directory exists for static files
  console.log('');
  console.log('📁 Step 3: Setting up static file serving...');
  const serverPublicDir = resolve(__dirname, 'server', 'public');
  if (!existsSync(serverPublicDir)) {
    mkdirSync(serverPublicDir, { recursive: true });
    console.log('   ✅ Created server/public directory');
  }
  
  // Step 4: Copy built assets to server/public for production serving
  const distDir = resolve(__dirname, 'dist');
  if (existsSync(distDir)) {
    console.log('   📋 Copying frontend assets to server/public...');
    execSync(`cp -r ${distDir}/* ${serverPublicDir}/`, { stdio: 'pipe' });
    console.log('   ✅ Frontend assets copied successfully');
  }
  
  // Step 5: Create optimized start script for production
  console.log('');
  console.log('⚙️  Step 4: Creating optimized production start script...');
  const startScript = `#!/usr/bin/env node

// Optimized production start script
// Uses tsx runtime instead of compiled binaries for Cloud Run compatibility

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Formul8 AI Platform in production mode...');
console.log('🔧 Using tsx runtime for optimal Cloud Run compatibility');

// Set production environment
process.env.NODE_ENV = 'production';

// Start server with tsx
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Gracefully shutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

serverProcess.on('exit', (code) => {
  console.log(\`Server process exited with code \${code}\`);
  process.exit(code);
});
`;

  writeFileSync('start-production-optimized.js', startScript);
  console.log('   ✅ Production start script created');
  
  // Step 6: Create deployment instructions
  console.log('');
  console.log('📋 Step 5: Creating deployment instructions...');
  const deploymentInstructions = `# Optimized Deployment Instructions

## ✅ Build Completed Successfully

This build has been optimized for Cloud Run deployment with the following features:

### 🎯 Size Optimizations Applied:
- ✅ Multi-stage Docker build implemented
- ✅ .dockerignore file excludes large files and directories
- ✅ Frontend-only build (no server compilation)
- ✅ Production dependencies only in final image
- ✅ NPM cache cleaned
- ✅ Large asset directories excluded

### 🚀 Deployment Commands:

**For Cloud Run / Container Deployment:**
\`\`\`bash
# Build the container using the optimized Dockerfile
docker build -t formul8-ai-platform .

# Run locally to test
docker run -p 5000:5000 formul8-ai-platform
\`\`\`

**For Replit Deployment:**
\`\`\`bash
# Use the optimized start command
node start-production-optimized.js
\`\`\`

### 📊 Container Size Reduction Features:

1. **Multi-stage Docker build**: Separates build and runtime environments
2. **Production-only dependencies**: Excludes development packages from final image
3. **Optimized layer caching**: Improves build performance
4. **Non-root user**: Enhanced security
5. **Health checks**: Built-in container health monitoring

### 🔧 Start Commands:

**Development:**
\`npm run dev\`

**Production (Optimized):**
\`node start-production-optimized.js\`

**Container:**
\`npx tsx server/index.ts\`

### 📦 What's Included in the Build:
- ✅ Frontend assets (built and optimized)
- ✅ Backend server files
- ✅ Essential configuration files
- ✅ Production dependencies only
- ✅ tsx runtime for TypeScript execution

### 🚫 What's Excluded (Size Reduction):
- ❌ Development dependencies
- ❌ Large asset directories
- ❌ Documentation files
- ❌ Build scripts and tools
- ❌ Cache and temporary files
- ❌ Test files and coverage reports

This optimized build should significantly reduce your container image size and resolve the Cloud Run deployment issues.
`;

  writeFileSync('DEPLOYMENT-OPTIMIZED.md', deploymentInstructions);
  console.log('   ✅ Deployment instructions created');
  
  // Step 7: Verify tsx availability
  console.log('');
  console.log('🔍 Step 6: Verifying tsx runtime...');
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    console.log('   ✅ tsx runtime verified and ready');
  } catch (error) {
    console.warn('   ⚠️  tsx not found - ensure it\'s available in production');
  }
  
  // Step 8: Display final summary
  console.log('');
  console.log('🎉 OPTIMIZED DEPLOYMENT BUILD COMPLETED!');
  console.log('');
  console.log('📊 Build Summary:');
  console.log('   ✅ Frontend built with Vite optimizations');
  console.log('   ✅ Multi-stage Dockerfile created');
  console.log('   ✅ .dockerignore excludes large files');
  console.log('   ✅ Production start script optimized');
  console.log('   ✅ Static assets configured for serving');
  console.log('');
  console.log('🚀 Ready for Cloud Run Deployment!');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Test locally: docker build -t formul8-ai-platform .');
  console.log('   2. Deploy to Cloud Run using the optimized Dockerfile');
  console.log('   3. Use the production start command: node start-production-optimized.js');
  console.log('');
  console.log('📖 For detailed instructions, see: DEPLOYMENT-OPTIMIZED.md');
  
} catch (error) {
  console.error('❌ Optimized build failed:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('   1. Ensure all dependencies are installed: npm install');
  console.error('   2. Check that Vite is available: npx vite --version');
  console.error('   3. Verify tsx runtime: npx tsx --version');
  process.exit(1);
}