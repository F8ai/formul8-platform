#!/bin/bash

echo "🧪 Testing Minimal Docker Context Size..."

cd docker-build-context || { echo "❌ docker-build-context not found"; exit 1; }

echo "📊 Analyzing minimal context contents:"
echo "Total size: $(du -sh . | cut -f1)"
echo ""

echo "📁 Directory breakdown:"
du -sh */ 2>/dev/null | sort -hr

echo ""
echo "📋 File listing:"
ls -la

echo ""
echo "✅ This context should build successfully - only $(du -sh . | cut -f1) total"
echo ""
echo "🐳 Ready for Docker build with command:"
echo "   docker build -t formul8-platform-minimal ."

cd ..
echo ""
echo "🔍 For comparison, main directory size (with cache): $(du -sh . | cut -f1)"