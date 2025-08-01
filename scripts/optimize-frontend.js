#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🎯 Frontend bundle optimization starting...');

// Create optimized component loader
const componentLoaderContent = `import { lazy } from 'react';
import { Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-300 h-4 w-4"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
        <div className="h-2 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Dynamic component wrapper
export const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// Lazy-loaded page components
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyAgents = lazy(() => import('../pages/Agents'));
export const LazyQueries = lazy(() => import('../pages/Queries'));
export const LazyVerifications = lazy(() => import('../pages/Verifications'));
export const LazySettings = lazy(() => import('../pages/Settings'));
export const LazyChat = lazy(() => import('../pages/Chat'));
export const LazyBaseline = lazy(() => import('../pages/Baseline'));
export const LazyNetworkVisualization = lazy(() => import('../pages/NetworkVisualization'));

// Lazy-loaded UI components (heavy ones)
export const LazyDataTable = lazy(() => import('../components/ui/data-table'));
export const LazyChart = lazy(() => import('../components/ui/chart'));
export const LazyFormBuilder = lazy(() => import('../components/ui/form-builder'));

// Preload critical routes
export const preloadCriticalRoutes = () => {
  // Preload dashboard since it's commonly accessed first
  import('../pages/Dashboard');
  // Preload chat since it's the primary interface
  import('../pages/Chat');
};
`;

writeFileSync(join(rootDir, 'client/src/utils/lazy-components.tsx'), componentLoaderContent);
console.log('✅ Created lazy component loader');

// Create bundle analyzer configuration
const bundleAnalyzerContent = `#!/usr/bin/env node

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
    const bundleInfo = execSync(\`find "\${distPath}" -name "*.js" -exec ls -lh {} \\; | awk '{print $5 " " $9}'\`, {
      encoding: 'utf8',
      cwd: rootDir
    });
    
    console.log('📦 Bundle Analysis Results:');
    console.log(\`Build time: \${buildTime}s\`);
    console.log('\\nJavaScript bundles:');
    console.log(bundleInfo);
    
    // Create analysis report
    const report = \`# Bundle Analysis Report
Generated: \${new Date().toISOString()}
Build time: \${buildTime}s

## JavaScript Bundles
\${bundleInfo}

## Optimization Recommendations
- Use dynamic imports for non-critical routes
- Lazy load heavy UI components
- Consider CDN for static assets
- Enable gzip compression on server
\`;
    
    writeFileSync(join(rootDir, 'bundle-analysis.md'), report);
    console.log('\\n✅ Bundle analysis saved to bundle-analysis.md');
  }
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
}
`;

writeFileSync(join(rootDir, 'scripts/analyze-bundle.js'), bundleAnalyzerContent);
console.log('✅ Created bundle analyzer script');

// Create environment-specific build configuration
const envBuildContent = `# Environment-specific build optimizations

# Production build environment variables
VITE_BUILD_OPTIMIZE=true
GENERATE_SOURCEMAP=false
VITE_LEGACY_SUPPORT=false

# Bundle optimization flags
VITE_CHUNK_SIZE_WARNING_LIMIT=1000
VITE_MINIFY=terser

# Asset optimization
VITE_COMPRESS_ASSETS=true
VITE_INLINE_LIMIT=4096

# Development exclusions for deployment
EXCLUDE_DEV_DEPENDENCIES=true
EXCLUDE_DOCS=true
EXCLUDE_LARGE_ASSETS=true
`;

writeFileSync(join(rootDir, '.env.build'), envBuildContent);
console.log('✅ Created build environment configuration');

console.log('');
console.log('🎉 Frontend optimization setup completed!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Update your main App.tsx to use lazy components');
console.log('2. Run: node scripts/analyze-bundle.js');
console.log('3. Run: node scripts/optimize-deployment.js');
console.log('');