FROM node:18-alpine

# Instalando pnpm globalmente (se o comando de execução precisar)
RUN npm install -g pnpm

WORKDIR /app

# Copiamos apenas o necessário para rodar a app
COPY dist ./dist
COPY package.json ./
COPY node_modules ./node_modules
COPY prisma ./prisma
COPY tsconfig.json ./ 

# Comando de produção (a base assume que prisma migrate já foi feito)
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]