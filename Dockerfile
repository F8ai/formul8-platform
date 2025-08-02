# Ultra-optimized multi-stage build for Replit deployment - SIZE OPTIMIZED
FROM node:20-alpine AS base

# Install only essential system packages and clean aggressively
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apk/lists/* /usr/share/man

# Stage 1: Build stage (includes all dependencies temporarily)
FROM base AS builder
WORKDIR /build

# Copy package files
COPY package*.json ./
# Install ALL dependencies for building (will be discarded)
RUN npm ci --prefer-offline --no-audit --silent --ignore-scripts && \
    rm -rf ~/.npm /tmp/*

# Copy source files for build only
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts tsconfig.json components.json ./

# Build frontend with aggressive optimization
RUN npx vite build --mode production && \
    rm -rf node_modules .npm-cache

# Stage 2: Ultra-minimal production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install absolute minimum system packages
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apk/lists/* /usr/share/man

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --silent --ignore-scripts && \
    npm install tsx --no-save --silent && \
    npm cache clean --force && \
    rm -rf /tmp/* ~/.npm /root/.cache /root/.local

# Copy built frontend from builder stage (should be ~2-3MB)
COPY --from=builder /build/dist/public ./server/public

# Copy only essential backend files
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Create non-root user and set ownership
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app && \
    chown -R app:app /app && \
    rm -rf /tmp/*

USER app

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/health || exit 1

EXPOSE ${PORT:-5000}

# Start server with tsx (TypeScript execution)
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server/index.ts"]
