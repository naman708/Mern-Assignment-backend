# syntax=docker/dockerfile:1

# ─── Stage 1: build ───────────────────────────────────────────────────────────
# Compile TypeScript to dist/ using the full dependency set (incl. devDeps).
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
# Minimal image with production deps and the compiled output only.
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled JavaScript from the builder stage.
COPY --from=builder /app/dist ./dist

# Writable uploads dir, owned by the unprivileged runtime user.
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 5000

# Probe the existing /api/health route without needing curl/wget in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
