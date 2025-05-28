# ───── builder ─────
FROM node:18-alpine AS builder
WORKDIR /app


COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN npm install -g pnpm \
  && pnpm install \
  && pnpm exec prisma generate


COPY tsconfig.base.json tsconfig.dev.json tsconfig.build.json ./
COPY src ./src
RUN pnpm run build    

# ───── development ─────
FROM builder AS dev
ENV NODE_ENV=development
WORKDIR /app

CMD ["pnpm", "run", "start:dev"]

# ───── production ─────
FROM node:18-alpine AS prod
WORKDIR /app


RUN npm install -g pnpm


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma


COPY tsconfig.prod.json tsconfig.json

ENV NODE_ENV=production


CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]