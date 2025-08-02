#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import { build } from 'esbuild';

console.log('🚀 Building Ultra-Optimized Formul8 Platform...\n');

async function buildOptimized() {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  try {
    // Step 1: Build frontend with aggressive code splitting
    console.log('⚛️  Building frontend with aggressive optimization...');
    
    // Create a temporary vite config for ultra optimization
    const tempViteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          'router': ['wouter'],
          
          // UI Library chunks (split Radix UI into smaller pieces)
          'ui-core': [
            '@radix-ui/react-slot', 
            '@radix-ui/react-label',
            '@radix-ui/react-separator'
          ],
          'ui-overlays': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-tooltip'
          ],
          'ui-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group', 
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group'
          ],
          'ui-layout': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-menubar'
          ],
          'ui-feedback': [
            '@radix-ui/react-toast',
            '@radix-ui/react-progress',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-aspect-ratio'
          ],
          
          // Data & Charts (largest libraries)
          'data-table': ['@tanstack/react-table'],
          'charts': ['recharts'],
          'query': ['@tanstack/react-query'],
          
          // Heavy visualization libraries
          'graphs': ['@xyflow/react', 'react-cytoscapejs', 'cytoscape'],
          
          // Animation
          'animation': ['framer-motion'],
          
          // Form handling  
          'forms': ['react-hook-form', '@hookform/resolvers'],
          
          // Icons
          'icons': ['lucide-react', 'react-icons'],
          
          // Utils
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 300,
    minify: true
  }
});
`;
    
    fs.writeFileSync('vite.config.temp.js', tempViteConfig);
    
    // Build with temporary config
    execSync('npx vite build --config vite.config.temp.js', { 
      stdio: 'inherit', 
      cwd: process.cwd() 
    });
    
    // Clean up temp config
    fs.unlinkSync('vite.config.temp.js');
    
    // Step 2: Build backend with esbuild
    console.log('🔧 Building optimized backend...');
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
      treeShaking: true
    });

    // Step 3: Create optimized start script
    console.log('📝 Creating production files...');
    const startScript = `#!/bin/bash
echo "🚀 Starting Optimized Formul8 Platform..."
exec node index.js
`;
    fs.writeFileSync('dist/start.sh', startScript);
    fs.chmodSync('dist/start.sh', '755');

    // Create production package.json
    const prodPackage = {
      name: "formul8-platform-optimized",
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

    // Step 4: Analyze final sizes
    console.log('\n📊 Ultra-Optimized Build Analysis:');
    const publicSize = execSync('du -sh dist/public 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
    const backendSize = execSync('du -sh dist/index.js 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
    const totalSize = execSync('du -sh dist 2>/dev/null || echo "N/A"', { encoding: 'utf8' }).trim();
    
    console.log(`   Frontend: ${publicSize.split('\t')[0] || 'N/A'}`);
    console.log(`   Backend:  ${backendSize.split('\t')[0] || 'N/A'}`);
    console.log(`   Total:    ${totalSize.split('\t')[0] || 'N/A'}`);

    // Show chunk breakdown
    console.log('\n📦 Chunk Analysis:');
    try {
      const assetFiles = fs.readdirSync('dist/public/assets').filter(f => f.endsWith('.js'));
      assetFiles.forEach(file => {
        const size = fs.statSync(`dist/public/assets/${file}`).size;
        const sizeMB = (size / 1024 / 1024).toFixed(2);
        if (size > 50000) { // Only show chunks > 50KB
          console.log(`   ${file}: ${sizeMB}MB`);
        }
      });
    } catch (e) {
      console.log('   Unable to analyze chunks');
    }

    console.log('\n✅ Ultra-optimized build completed!');
    console.log('\n🎯 Deployment command: cd dist && node index.js');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildOptimized().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});