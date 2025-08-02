#!/usr/bin/env node
/**
 * Production Build Script for Replit Deployment
 * Optimizes bundle size and prepares for deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🚀 Starting optimized production build...');

async function buildProduction() {
  try {
    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    try {
      await fs.rm('dist', { recursive: true, force: true });
      await fs.rm('client/dist', { recursive: true, force: true });
      await fs.rm('server/public', { recursive: true, force: true });
    } catch (error) {
      // Ignore if directories don't exist
    }

    // Step 2: Build frontend with optimizations
    console.log('📦 Building optimized frontend...');
    const { stdout: viteOutput } = await execAsync('npx vite build --mode production');
    console.log('Frontend build output:', viteOutput);

    // Step 3: Ensure server/public directory exists
    await fs.mkdir('server/public', { recursive: true });

    // Step 4: Copy built assets to server/public
    console.log('📋 Copying frontend assets to server...');
    try {
      const distExists = await fs.access('dist/public').then(() => true).catch(() => false);
      const clientDistExists = await fs.access('client/dist').then(() => true).catch(() => false);
      
      if (distExists) {
        await execAsync('cp -r dist/public/* server/public/');
        console.log('✅ Assets copied from dist/public/');
      } else if (clientDistExists) {
        await execAsync('cp -r client/dist/* server/public/');
        console.log('✅ Assets copied from client/dist/');
      } else {
        throw new Error('No build output found in dist/public or client/dist');
      }
    } catch (error) {
      console.error('❌ Error copying assets:', error.message);
      throw error;
    }

    // Step 5: Check asset sizes
    console.log('📊 Checking asset sizes...');
    try {
      const { stdout: sizeOutput } = await execAsync('du -sh server/public/');
      console.log('Frontend assets size:', sizeOutput.trim());
      
      // Check individual large files
      const { stdout: largeFiles } = await execAsync('find server/public -type f -size +500k -exec ls -lh {} \\; 2>/dev/null || true');
      if (largeFiles.trim()) {
        console.log('⚠️  Large files (>500KB):');
        console.log(largeFiles);
      }
    } catch (error) {
      console.log('Could not check asset sizes:', error.message);
    }

    // Step 6: Create production package.json with only runtime dependencies
    console.log('📝 Creating production package.json...');
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    const productionPackage = {
      name: packageJson.name,
      version: packageJson.version,
      type: packageJson.type,
      scripts: {
        start: "npx tsx server/index.ts"
      },
      dependencies: {
        // Core runtime dependencies only
        "@anthropic-ai/sdk": packageJson.dependencies["@anthropic-ai/sdk"],
        "@google/generative-ai": packageJson.dependencies["@google/generative-ai"],
        "@neondatabase/serverless": packageJson.dependencies["@neondatabase/serverless"],
        "drizzle-orm": packageJson.dependencies["drizzle-orm"],
        "express": packageJson.dependencies["express"],
        "express-session": packageJson.dependencies["express-session"],
        "connect-pg-simple": packageJson.dependencies["connect-pg-simple"],
        "passport": packageJson.dependencies["passport"],
        "passport-local": packageJson.dependencies["passport-local"],
        "openai": packageJson.dependencies["openai"],
        "zod": packageJson.dependencies["zod"],
        "zod-validation-error": packageJson.dependencies["zod-validation-error"],
        "tsx": packageJson.dependencies["tsx"],
        "node-fetch": packageJson.dependencies["node-fetch"],
        "js-yaml": packageJson.dependencies["js-yaml"],
        "@types/node": packageJson.dependencies["@types/node"],
        "@types/express": packageJson.dependencies["@types/express"],
        "@types/express-session": packageJson.dependencies["@types/express-session"],
        "@types/passport": packageJson.dependencies["@types/passport"],
        "@types/passport-local": packageJson.dependencies["@types/passport-local"]
      }
    };

    await fs.writeFile('package.production.json', JSON.stringify(productionPackage, null, 2));
    console.log('✅ Production package.json created');

    // Step 7: Create optimized Dockerfile for production
    console.log('🐳 Creating optimized Dockerfile...');
    const optimizedDockerfile = `# Ultra-optimized multi-stage build for Replit deployment
FROM node:20-alpine AS base

# Install only essential system packages
RUN apk add --no-cache curl dumb-init && \\
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apk/lists/*

# Stage 1: Build stage (all dependencies)
FROM base AS builder
WORKDIR /build

# Copy package files
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --silent --ignore-scripts

# Copy source files for build
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts tsconfig.json components.json ./

# Build frontend
RUN npx vite build --mode production

# Stage 2: Production runtime (minimal)
FROM base AS production
WORKDIR /app

# Use production package.json
COPY package.production.json ./package.json
COPY package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production --prefer-offline --no-audit --silent --ignore-scripts && \\
    npm cache clean --force && \\
    rm -rf /tmp/* ~/.npm /root/.cache

# Copy built frontend from builder stage
COPY --from=builder /build/dist/public ./server/public

# Copy backend source
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S app && \\
    adduser -S app -u 1001 -G app && \\
    chown -R app:app /app

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD curl -f http://localhost:\${PORT:-5000}/api/health || exit 1

EXPOSE \${PORT:-5000}

# Start server with tsx
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server/index.ts"]
`;

    await fs.writeFile('Dockerfile.optimized', optimizedDockerfile);
    console.log('✅ Optimized Dockerfile created');

    // Step 8: Build summary
    console.log('\\n🎉 Production build completed successfully!');
    console.log('\\n📋 Build Summary:');
    console.log('✅ Frontend built and optimized');
    console.log('✅ Assets copied to server/public/');
    console.log('✅ Production package.json created');
    console.log('✅ Optimized Dockerfile created');
    
    console.log('\\n🚀 Ready for deployment!');
    console.log('💡 Use: docker build -f Dockerfile.optimized -t formul8-frontend .');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildProduction();