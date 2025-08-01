# Multi-stage Docker build to reduce final image size
FROM node:20-alpine AS builder

# Install build dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code and build frontend
COPY . .
RUN npm run build:client || vite build

# Production stage - minimal image
FROM node:20-alpine AS production

# Install system dependencies and production packages
WORKDIR /app
COPY package*.json ./

# Install curl for health checks and production dependencies
RUN apk add --no-cache curl && \
    npm ci --only=production && \
    npm install tsx && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /app/dist

# Copy essential backend files only
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./
COPY vite.config.ts ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000
CMD ["npx", "tsx", "server/index.ts"]
