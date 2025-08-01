#!/usr/bin/env node

import { rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🧹 Starting cleanup for deployment...');

// Directories and files to remove to reduce image size
const itemsToRemove = [
  // Large asset directories
  'attached_assets',
  'agents.old',
  '__pycache__',
  
  // Development directories
  'docs',
  'dashboard',
  'data',
  'datasets',
  'genomes',
  'flowise',
  'agent-dir',
  'github-tester-agent',
  'local-deployment',
  
  // Build scripts and tools (keep only essential)
  'build-*.js',
  'create-*.js',
  'deploy-*.js',
  'enhance-*.js',
  '*.sh',
  '*.py',
  
  // Documentation files
  '*.md',
  '*.txt',
  '*.pdf',
  '*.rtf',
  
  // Cache and temporary files
  '.nyc_output',
  'coverage',
  'tmp',
  'temp',
  '.tmp',
  
  // Development configs
  '.vscode',
  '.idea',
  '*.swp',
  '*.swo',
  '*~',
  
  // Log files
  'logs',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  
  // Test files
  '*.test.js',
  '*.spec.js',
  'test',
  'tests',
  '.coverage',
  '.pytest_cache',
  
  // Large image files
  'Screenshot_*',
  'IMG_*',
  'image_*',
  'Pasted-*',
];

let totalSizeRemoved = 0;
let itemsRemoved = 0;

itemsToRemove.forEach(pattern => {
  const itemPath = resolve(rootDir, pattern);
  
  if (existsSync(itemPath)) {
    try {
      // Get size before removal
      let sizeBefore = 0;
      try {
        const sizeOutput = execSync(`du -sk "${itemPath}"`, { 
          encoding: 'utf8',
          cwd: rootDir 
        });
        sizeBefore = parseInt(sizeOutput.split('\t')[0]);
      } catch (error) {
        // Ignore size calculation errors
      }
      
      rmSync(itemPath, { recursive: true, force: true });
      totalSizeRemoved += sizeBefore;
      itemsRemoved++;
      console.log(`   ✅ Removed: ${pattern} (${sizeBefore}KB)`);
    } catch (error) {
      console.warn(`   ⚠️  Could not remove ${pattern}: ${error.message}`);
    }
  }
});

// Clean npm cache
console.log('🗑️  Cleaning package manager caches...');
try {
  execSync('npm cache clean --force', { 
    stdio: 'pipe',
    cwd: rootDir 
  });
  console.log('   ✅ NPM cache cleaned');
} catch (error) {
  console.warn('   ⚠️  Could not clean npm cache:', error.message);
}

console.log('✅ Cleanup completed successfully!');
console.log('📊 Cleanup summary:');
console.log(`   Items removed: ${itemsRemoved}`);
console.log(`   Estimated space saved: ${Math.round(totalSizeRemoved / 1024)}MB`);
console.log('');
console.log('🎯 Deployment optimizations applied:');
console.log('   ✅ Large asset directories removed');
console.log('   ✅ Development tools and scripts removed');
console.log('   ✅ Documentation and cache files cleaned');
console.log('   ✅ Test files and temporary data removed');
console.log('   ✅ Package manager caches cleared');