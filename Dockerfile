# syntax=docker/dockerfile:1

FROM node:22.12-alpine AS base
WORKDIR /app
ENV NPM_CONFIG_CACHE=/tmp/npm-cache
ENV npm_config_cache=/tmp/npm-cache

# Install all dependencies for the build, including devDependencies.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Install only production dependencies for the runtime image.
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next ./.next
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV HEALTH_CHECK_PATH=/api/health

CMD ["node", "server.js"]
