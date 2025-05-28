# ───── builder ─────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build    # usa tsconfig.build.json

# ───── development ─────
FROM builder AS dev
ENV NODE_ENV=development
# monta seu código com volume no docker-compose, hot-reload, etc.
CMD ["pnpm", "run", "start:dev"]

# ───── production ─────
FROM node:18-alpine AS prod
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# aponta tsconfig.prod.json pra aliases em runtime:
COPY tsconfig.prod.json ./tsconfig.json

ENV NODE_ENV=production
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]