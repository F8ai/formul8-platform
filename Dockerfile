# Optimized multi-stage build for Replit deployment
FROM node:20-alpine AS base

# Install essential system packages only
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/* /tmp/*

# Stage 1: Build frontend
FROM base AS builder
WORKDIR /build

# Copy package files and install ALL dependencies for building
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --silent

# Copy source files needed for build
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY components.json ./

# Build frontend with maximum optimization
RUN npx vite build --mode production --outDir dist/public

# Stage 2: Production runtime (minimal)
FROM base AS production
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --silent && \
    npm install tsx --no-save && \
    npm cache clean --force && \
    rm -rf /tmp/* ~/.npm /root/.cache

# Copy built frontend from builder
COPY --from=builder /build/dist/public ./server/public

# Copy backend source
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app && \
    chown -R app:app /app

USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/health || exit 1

EXPOSE ${PORT:-5000}

# Start server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server/index.ts"]
