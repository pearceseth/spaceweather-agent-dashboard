# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Builder
# Install dependencies and build the monorepo packages
# =============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/agent/package.json ./packages/agent/
COPY packages/api/package.json ./packages/api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/types/ ./packages/types/
COPY packages/agent/ ./packages/agent/
COPY packages/api/ ./packages/api/

# Build packages in dependency order: types -> agent -> api
# turbo handles the build order based on turbo.json configuration
RUN pnpm --filter @space-weather/types build && \
    pnpm --filter @space-weather/agent build && \
    pnpm --filter @space-weather/api build

# Prune dev dependencies for production
RUN pnpm prune --prod

# =============================================================================
# Stage 2: Runner
# Minimal production image with only runtime dependencies
# =============================================================================
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

WORKDIR /app

# Copy only what's needed for production
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=api:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=api:nodejs /app/packages/agent/dist ./packages/agent/dist
COPY --from=builder --chown=api:nodejs /app/packages/agent/package.json ./packages/agent/
COPY --from=builder --chown=api:nodejs /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=api:nodejs /app/packages/api/package.json ./packages/api/
COPY --from=builder --chown=api:nodejs /app/package.json ./

# Switch to non-root user
USER api

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the API server
CMD ["node", "packages/api/dist/index.js"]
