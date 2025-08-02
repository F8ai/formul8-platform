#!/bin/bash

echo "🔍 Deployment Context Verification"
echo "=================================="

echo "1. Main directory size (should NOT be used for Docker):"
du -sh . --exclude=docker-build-context
echo ""

echo "2. Minimal Docker context size (SHOULD be used for Docker):"
du -sh docker-build-context/
echo ""

echo "3. Docker context contents:"
ls -la docker-build-context/
echo ""

echo "4. Verifying .replit.deploy configuration:"
grep -A5 -B5 "dockerfile\|context" .replit.deploy
echo ""

echo "✅ The deployment should use:"
echo "   - Context: docker-build-context/ (8.0MB)"
echo "   - Dockerfile: docker-build-context/Dockerfile"
echo "   - NOT the main directory (6.5GB)"