# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Dependencies
# Install dependencies only (cached layer)
# =============================================================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/web/package.json ./packages/web/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# Build the types package and Next.js application
# =============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/web/package.json ./packages/web/

# Copy source files
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/types/ ./packages/types/
COPY packages/web/ ./packages/web/

# Build types first (web depends on it)
RUN pnpm --filter @space-weather/types build

# Set build-time environment variables
# NEXT_PUBLIC_* vars must be set at build time for Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js with standalone output
RUN pnpm --filter @space-weather/web build

# =============================================================================
# Stage 3: Runner
# Minimal production image with standalone Next.js output
# =============================================================================
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output from builder
# Next.js standalone includes only the necessary files
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public

# Switch to non-root user
USER nextjs

# Expose the web port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the Next.js server
# The standalone output creates a server.js in the package directory
CMD ["node", "packages/web/server.js"]
