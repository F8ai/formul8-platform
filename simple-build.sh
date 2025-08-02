#!/bin/bash
# Ultra-simple build for Replit deployment
echo "Building frontend only..."
npx vite build client
echo "Build complete"