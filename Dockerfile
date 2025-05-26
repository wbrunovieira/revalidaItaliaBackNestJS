# build stage
FROM node:18-alpine AS builder
WORKDIR /app

# install all deps and build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN npm run build

# runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

# install only prod deps
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# copy build artifacts + Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3333
ENV NODE_ENV=production

# run migrations then start
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]