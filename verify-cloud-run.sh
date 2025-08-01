#!/bin/bash
# Verify deployment readiness

echo "🔍 Verifying Cloud Run deployment readiness..."

# Check if optimized Dockerfile exists
if [ ! -f "Dockerfile.optimized" ]; then
  echo "❌ Dockerfile.optimized not found"
  exit 1
fi

# Check if frontend assets are built
if [ ! -d "server/public" ]; then
  echo "❌ Frontend assets not found in server/public/"
  exit 1
fi

# Test container build
echo "🐳 Testing container build..."
if docker build -f Dockerfile.optimized -t formul8-test . > /dev/null 2>&1; then
  echo "✅ Container builds successfully"
  
  # Get container size
  SIZE=$(docker images formul8-test:latest --format "{{.Size}}")
  echo "📊 Container size: $SIZE"
  
  # Cleanup test image
  docker rmi formul8-test > /dev/null 2>&1
else
  echo "❌ Container build failed"
  exit 1
fi

echo "✅ All checks passed - ready for Cloud Run deployment!"
