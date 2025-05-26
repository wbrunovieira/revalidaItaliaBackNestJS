# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos essenciais primeiro
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar apenas o schema do Prisma antes de gerar e aplicar migrações
COPY prisma ./prisma
RUN npx prisma generate

# Copiar todo o restante (depois que schema já foi usado)
COPY . .

# Build do projeto
RUN pnpm build
RUN npx prisma migrate deploy

# Etapa de produção
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

CMD ["node", "dist/main"]