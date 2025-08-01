#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('📊 Analyzing bundle size...');

try {
  // Build with bundle analysis
  const buildStart = Date.now();
  
  execSync('vite build --mode production', {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ANALYZE_BUNDLE: 'true'
    }
  });
  
  const buildTime = ((Date.now() - buildStart) / 1000).toFixed(2);
  
  // Get bundle sizes
  const distPath = join(rootDir, 'dist/public');
  
  if (existsSync(distPath)) {
    const bundleInfo = execSync(`find "${distPath}" -name "*.js" -exec ls -lh {} \; | awk '{print $5 " " $9}'`, {
      encoding: 'utf8',
      cwd: rootDir
    });
    
    console.log('📦 Bundle Analysis Results:');
    console.log(`Build time: ${buildTime}s`);
    console.log('\nJavaScript bundles:');
    console.log(bundleInfo);
    
    // Create analysis report
    const report = `# Bundle Analysis Report
Generated: ${new Date().toISOString()}
Build time: ${buildTime}s

## JavaScript Bundles
${bundleInfo}

## Optimization Recommendations
- Use dynamic imports for non-critical routes
- Lazy load heavy UI components
- Consider CDN for static assets
- Enable gzip compression on server
`;
    
    writeFileSync(join(rootDir, 'bundle-analysis.md'), report);
    console.log('\n✅ Bundle analysis saved to bundle-analysis.md');
  }
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
}
