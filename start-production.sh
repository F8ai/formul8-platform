#!/bin/bash
# Production startup script - optimized for deployment platforms

export NODE_ENV=production
export PORT=${PORT:-5000}

echo "🚀 Starting Formul8 Platform in production mode..."
echo "📊 Node version: $(node --version)"
echo "🔧 tsx version: $(npx tsx --version)"
echo "🌐 Port: $PORT"

# Start server with tsx (TypeScript runtime)
exec npx tsx server/index.ts
