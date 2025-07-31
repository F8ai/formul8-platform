#!/bin/bash

# Replit Deployment Script
# This script is optimized for Replit's deployment environment

echo "🚀 Replit Deployment Starting..."
echo "================================="

# Set production environment
export NODE_ENV=production

# Build the frontend
echo "📦 Building frontend with Vite..."
vite build

# Copy static files to server directory
echo "📁 Setting up static files..."
if [ -d "server/public" ]; then
    rm -rf server/public
fi

if [ -d "dist/public" ]; then
    cp -r dist/public server/public
else
    mkdir -p server/public
    cp -r dist/* server/public/
fi

echo "✅ Build completed successfully!"
echo "🚀 Starting server with tsx runtime..."

# Start the server with tsx
exec npx tsx server/index.ts