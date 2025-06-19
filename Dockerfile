# ───── builder ─────
FROM --platform=linux/arm64 node:18-alpine AS builder
WORKDIR /app

# 1) Instala dependências necessárias
COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache openssl openssl-dev \
  && npm install -g pnpm \
  && pnpm install --frozen-lockfile

# 2) Copia schema e gera o client do Prisma
COPY prisma ./prisma
# Para Mac M3 - força binary engine
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_QUERY_ENGINE_TYPE=binary
RUN pnpm exec prisma generate

# 3) Compila o TypeScript
COPY tsconfig*.json ./
COPY src ./src
RUN pnpm run build

# ───── development ─────
FROM --platform=linux/arm64 node:18-alpine AS dev
WORKDIR /app
RUN npm install -g pnpm

# Copia arquivos necessários do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json ./

ENV NODE_ENV=development
CMD ["pnpm", "run", "start:dev"]

# ───── production ─────
FROM --platform=linux/arm64 node:18-alpine AS prod
WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json ./

ENV NODE_ENV=production
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]