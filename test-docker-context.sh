#!/bin/bash

echo "🔍 Testing Docker Build Context Size..."

# Create a temporary Docker context test
cat > Dockerfile.test << 'EOF'
FROM alpine:latest
WORKDIR /app
COPY . .
RUN du -sh . && ls -la
EOF

echo "📊 Current directory breakdown:"
du -sh */ 2>/dev/null | sort -hr | head -10

echo -e "\n🐳 Building test Docker image to check context size..."
docker build -f Dockerfile.test -t context-test . 2>&1 | grep -E "(Sending|context|size|MB|GB)" || echo "No size info captured"

echo -e "\n🧹 Cleaning up test files..."
rm -f Dockerfile.test
docker image rm context-test 2>/dev/null || true

echo -e "\n✅ Context test complete!"