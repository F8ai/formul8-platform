#!/bin/bash

# Optimized build script for Cloud Run deployment
set -e

echo "🚀 Starting optimized build for deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm ci --include=dev --prefer-offline --no-audit

# Step 2: Build frontend with production optimizations
echo "🏗️  Building frontend..."
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
npm run build:client 2>/dev/null || vite build --mode production --minify

# Step 3: Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build output created in dist/ directory"
echo "📊 Build size:"
du -sh dist/ 2>/dev/null || echo "Unable to calculate dist size"

# Step 4: Clean up development dependencies (keep in separate step for Docker)
echo "🧹 Cleaning development dependencies..."
rm -rf node_modules
npm ci --only=production --prefer-offline --no-audit
npm cache clean --force

# Step 5: Show final size
echo "📊 Final optimized size:"
du -sh . 2>/dev/null || echo "Unable to calculate total size"

echo "✅ Optimized build complete and ready for deployment!"