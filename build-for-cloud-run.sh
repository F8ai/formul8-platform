#!/bin/bash
# Cloud Run optimized Docker build
set -e

echo "🚀 Building optimized container for Cloud Run..."

# Build with optimized Dockerfile
docker build \
  --file Dockerfile.optimized \
  --tag formul8-platform:latest \
  --build-arg NODE_ENV=production \
  .

echo "📊 Analyzing final container size..."
docker images formul8-platform:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "✅ Container build complete!"
echo "🌐 Ready for Cloud Run deployment"
