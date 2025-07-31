#!/bin/bash

# Working build script that avoids esbuild binary issues
# Use this instead of npm run build

echo "🔧 Using working build command (avoiding esbuild binary issues)..."
node deployment-build-command.js

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📋 Ready for deployment with: node deployment-start-command.js"
else
    echo "❌ Build failed"
    exit 1
fi