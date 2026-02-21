# Multi-stage Dockerfile for NestJS Application

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install required dependencies for youtube-dl-exec
RUN apk add --no-cache python3 py3-pip ffmpeg

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    python3 \
    py3-pip \
    ffmpeg

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Set environment variable to skip postinstall scripts that might fail
ENV SKIP_POSTINSTALL=1

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Run postinstall for youtube-dl-exec manually (if needed)
RUN npm rebuild youtube-dl-exec || true

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy necessary files
COPY --chown=nestjs:nodejs bodies.json ./
COPY --chown=nestjs:nodejs check-redis.js ./

# Create data directory for conversations
RUN mkdir -p /app/data/conversations && \
    chown -R nestjs:nodejs /app/data

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
