#!/bin/bash
# Production start script for Replit deployment
set -e

echo "🚀 Starting Formul8 Frontend in production mode..."

# Check if built assets exist
if [ ! -d "server/public" ]; then
    echo "📦 Building frontend assets..."
    npx vite build
    
    # Copy assets to server/public
    mkdir -p server/public
    if [ -d "dist/public" ]; then
        cp -r dist/public/* server/public/
    elif [ -d "client/dist" ]; then
        cp -r client/dist/* server/public/
    else
        echo "❌ No build output found"
        exit 1
    fi
    echo "✅ Assets copied to server/public/"
fi

# Check asset size
ASSET_SIZE=$(du -sh server/public/ | cut -f1)
echo "📊 Frontend assets size: $ASSET_SIZE"

# Start the server
echo "🌐 Starting Express server..."
NODE_ENV=production npx tsx server/index.ts