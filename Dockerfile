# Multi-stage Docker build to reduce final image size
FROM node:20-alpine AS builder

# Install build dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev --prefer-offline --no-audit

# Copy only essential source files for build
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY components.json ./

# Build frontend with optimizations
RUN npm run build:client || vite build --mode production --minify --sourcemap false

# Production stage - minimal image
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

# Install production packages
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm install tsx --no-save && \
    npm cache clean --force && \
    rm -rf /tmp/* ~/.npm

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /app/dist

# Copy essential backend files only
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app && \
    chmod +x /app/server/index.ts

# Switch to non-root user
USER nextjs

# Health check with timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server/index.ts"]
