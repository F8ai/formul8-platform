#!/bin/bash

# Production startup script for Formul8 Platform
echo "Starting Formul8 Platform in production mode..."

# Set environment
export NODE_ENV=production
export PORT=${PORT:-5000}

# Check if we're in the minimal context directory
if [ -f "dist/index.js" ]; then
    echo "Running from minimal context - starting pre-built application..."
    cd dist && node index.js
elif [ -f "build-optimized.js" ]; then
    echo "Running from main directory - building and starting..."
    node build-optimized.js
    cd dist && node index.js
else
    echo "Error: Neither dist/index.js nor build script found"
    exit 1
fi