#!/bin/bash

echo "🚀 Creating Minimal Docker Context for Formul8 Platform..."

# Create a clean directory for Docker build
DOCKER_DIR="docker-build-context"
rm -rf "$DOCKER_DIR"
mkdir -p "$DOCKER_DIR"

echo "📋 Step 1: Building production assets..."
node build-optimized.js

echo "📦 Step 2: Copying essential files only..."

# Copy package.json and lock file
cp package.json "$DOCKER_DIR/"
cp package-lock.json "$DOCKER_DIR/" 2>/dev/null || echo "No package-lock.json found"

# Copy TypeScript configs
cp tsconfig.json "$DOCKER_DIR/" 2>/dev/null || echo "No tsconfig.json found"
cp drizzle.config.ts "$DOCKER_DIR/" 2>/dev/null || echo "No drizzle.config.ts found"

# Copy source code (minimal)
mkdir -p "$DOCKER_DIR/client/src"
mkdir -p "$DOCKER_DIR/server"
mkdir -p "$DOCKER_DIR/shared"

# Copy only essential client files
cp -r client/src "$DOCKER_DIR/client/"
cp client/index.html "$DOCKER_DIR/client/" 2>/dev/null || echo "No client index.html"

# Copy server files
cp -r server/* "$DOCKER_DIR/server/"

# Copy shared utilities
cp -r shared/* "$DOCKER_DIR/shared/"

# Copy the built assets
cp -r dist "$DOCKER_DIR/"

echo "📏 Step 3: Analyzing minimal context size..."
du -sh "$DOCKER_DIR"
echo ""
echo "📂 Contents breakdown:"
du -sh "$DOCKER_DIR"/* | sort -hr

# Create optimized Dockerfile for minimal context
cat > "$DOCKER_DIR/Dockerfile" << 'EOF'
# Ultra-minimal Dockerfile for Formul8 Platform
# Uses pre-built assets to avoid large build context

FROM node:18-alpine

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy pre-built production files
COPY --chown=nodejs:nodejs dist ./

# Install only production runtime dependencies
COPY package.json ./
RUN npm ci --only=production --omit=dev && npm cache clean --force && rm -rf /tmp/*

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
EOF

# Create .dockerignore for the minimal context
cat > "$DOCKER_DIR/.dockerignore" << 'EOF'
# Minimal .dockerignore for pre-built context
node_modules
.git
*.md
*.log
.env*
*.tmp
*.temp
EOF

echo ""
echo "✅ Minimal Docker context created in '$DOCKER_DIR/'"
echo "📊 Final size: $(du -sh "$DOCKER_DIR" | cut -f1)"
echo ""
echo "🐳 To build Docker image:"
echo "   cd $DOCKER_DIR && docker build -t formul8-platform-minimal ."
echo ""
echo "🚀 To run:"
echo "   docker run -p 5000:5000 -e DATABASE_URL=\$DATABASE_URL formul8-platform-minimal"