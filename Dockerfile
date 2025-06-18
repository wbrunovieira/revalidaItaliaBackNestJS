# ───── builder ─────
FROM node:18-bookworm-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# forçar o binary engine em vez do library
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

RUN apt-get update && \
  apt-get install -y openssl libssl-dev && \
  npm install -g pnpm && \
  pnpm install --frozen-lockfile && \
  pnpm exec prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN pnpm run build

# ───── development ─────
FROM builder AS dev
ENV NODE_ENV=development
CMD ["pnpm", "run", "start:dev"]

# ───── production ─────
FROM node:18-alpine AS prod
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist       ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma     ./prisma
COPY package.json pnpm-lock.yaml    ./
COPY tsconfig*.json ./
ENV NODE_ENV=production
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]