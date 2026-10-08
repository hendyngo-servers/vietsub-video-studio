# ==============================================================================
# COMMERCIAL MULTI-STAGE DOCKERFILE FOR VIETSUB VIDEO STUDIO PRO
# ==============================================================================

# STAGE 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle with Vite and PWA service workers
RUN npm run build

# STAGE 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies including ffmpeg for media processing
RUN apk add --no-cache ffmpeg ca-certificates curl

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and server codebase
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/public ./public

# Install tsx globally or locally to run TypeScript server in production
RUN npm install -g tsx

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["tsx", "server.ts"]
