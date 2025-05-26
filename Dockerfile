# build stage
FROM node:18-alpine AS builder
WORKDIR /app

# install all deps and build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN npx prisma migrate deploy
COPY . .
RUN npx prisma generate
RUN npm run build

# runtime stage
FROM node:18-alpine AS runner
WORKDIR /app


COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3333
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]