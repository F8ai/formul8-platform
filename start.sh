#!/bin/sh
# Production startup for Formul8 Platform
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "🚀 Starting Formul8 Platform on port $PORT..."
echo "📁 Serving static assets from server/public/"

# Start the server with tsx (no compilation needed)
exec npx tsx server/index.ts
