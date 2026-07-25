# syntax=docker/dockerfile:1
# =============================================================================
# ProxyGPT Online — production container image
#
#   Stage 1 (builder)  : install all deps, build the Vite frontend + esbuild
#                        server bundle into /app/dist.
#   Stage 2 (runtime)  : lean image with production deps + the compiled /dist.
#
# Build:  docker build -t proxygpt:latest .
# Run:    docker run -d --name proxygpt-app --network host \
#           -e PORT=3000 -v /root/proxygpt-docker-data:/app/data \
#           --restart unless-stopped proxygpt:latest
# =============================================================================

# ---- Stage 1: build ----------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install ALL dependencies (build tools included) from the lockfile.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and produce dist/ (frontend bundle + dist/server.cjs).
COPY . .
RUN npm run build

# ---- Stage 2: runtime --------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Only production dependencies (no tsc / tailwind build tooling).
# vite/express/dotenv/fflate are runtime deps and are required by server.cjs.
# --ignore-scripts skips esbuild's postinstall binary-validation (a transitive
# dep of vite); we never invoke esbuild or the vite dev server at runtime, so
# the binary is not needed and its postinstall would otherwise fail here.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Compiled frontend + server bundle from the builder stage.
COPY --from=builder /app/dist ./dist

# JSON "database" lives here — mount a volume so it survives container restarts.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Lightweight readiness probe against the app's own health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# node as PID 1 so Docker signals (stop/restart) reach the server directly.
CMD ["node", "dist/server.cjs"]
