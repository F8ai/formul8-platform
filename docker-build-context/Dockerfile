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
