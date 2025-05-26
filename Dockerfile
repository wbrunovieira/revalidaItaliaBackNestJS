# etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# instala dependências completas
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# copia todo o código (incluindo prisma/)
COPY . .

# gera Prisma Client e builda
RUN npx prisma generate
RUN npm run build


# etapa de runtime
FROM node:18-alpine AS runner
WORKDIR /app

# instala só dependências de produção
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# **copia o schema do prisma para o runner**

# copia artefatos do build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3333
ENV NODE_ENV=production

# roda migrações e depois inicia a aplicação
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]