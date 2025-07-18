# Troubleshooting Database

Este arquivo contém problemas comuns encontrados no projeto e suas soluções comprovadas.

## Docker Build Issues

### Prisma Generate Failing - ARM64 Binary Download Error

**Data:** 18/07/2025  
**Problema:** Docker build falha com erro "403 Forbidden" ao tentar baixar binários do Prisma

#### Sintomas:
```
Error: Failed to fetch the engine file at https://binaries.prisma.sh/all_commits/aee10d5a411e4360c6d3445ce4810ca65adbf3e8/linux-musl-arm64-openssl-3.0.x/query-engine.gz - 403 Forbidden
```

#### Contexto:
- Erro ocorre em `docker build --no-cache`
- Projeto funcionava normalmente antes
- Versão do Prisma: 6.10.0
- Arquitetura: ARM64 (Mac M3 Pro Max)
- Dockerfile usa: `FROM --platform=linux/arm64 node:XX-alpine`

#### Diagnóstico:
1. **Verificar se é problema de rede:**
   ```bash
   curl -I https://binaries.prisma.sh/all_commits/aee10d5a411e4360c6d3445ce4810ca65adbf3e8/linux-musl-arm64-openssl-3.0.x/query-engine.gz
   ```

2. **Verificar imagens existentes:**
   ```bash
   docker images | grep revalida
   ```

3. **Verificar se problema é global:**
   - Pesquisar issues GitHub do Prisma
   - Problema conhecido desde Janeiro 2025

#### Soluções:

**✅ Solução 1: Usar imagem backup (Recomendado)**
```bash
# Verificar imagens disponíveis
docker images | grep backup-working

# Usar imagem existente
docker compose -f compose.dev.yaml up -d

# Instalar dependências no container existente
docker exec ead-backend-dev pnpm install
docker exec ead-backend-dev pnpm add @nestjs/swagger swagger-ui-express
```

**✅ Solução 2: Backup de imagem funcionando**
```bash
# Criar backup da imagem atual
docker tag revalida-italia-back-backend:latest revalida-italia-back-backend:backup-working-$(date +%Y%m%d)

# Salvar como arquivo
docker save revalida-italia-back-backend:backup-working-$(date +%Y%m%d) | gzip > revalida-backup-$(date +%Y%m%d).tar.gz

# Restaurar backup
docker load < revalida-backup-YYYYMMDD.tar.gz
```

**⚠️ Solução 3: Workaround temporário - x86_64**
```dockerfile
# Temporariamente usar x86_64 ao invés de ARM64
FROM --platform=linux/amd64 node:22-alpine AS builder
FROM --platform=linux/amd64 node:22-alpine AS dev  
FROM --platform=linux/amd64 node:22-alpine AS prod
```

**❌ Tentativas que NÃO funcionaram:**
- `ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
- `ENV PRISMA_ENGINES_MIRROR=https://github.com/prisma/prisma-engines/releases`
- Trocar versão do Node (18, 20, 22)
- Aguardar/tentar novamente

#### Prevenção:
- Sempre criar backup antes de `docker build --no-cache`
- Manter pelo menos uma imagem funcionando
- Documentar versões que funcionam

---

## Container Runtime Issues

### Container Restart Loop

**Problema:** Container reinicia continuamente
**Solução:** Verificar logs e dependências

```bash
# Verificar logs
docker logs ead-backend-dev --tail=50

# Verificar se database está healthy
docker ps

# Restart completo
docker compose -f compose.dev.yaml down
docker compose -f compose.dev.yaml up -d
```

---

## Development Issues

### Hot Reload Não Funciona

**Problema:** Mudanças no código não são refletidas
**Solução:** Reiniciar container de desenvolvimento

```bash
# Reiniciar apenas backend
docker compose -f compose.dev.yaml restart ead-backend-dev

# Ou rebuild específico
docker exec ead-backend-dev pnpm run build
```

---

## Database Issues

### Prisma Client Outdated

**Problema:** Erros de tipos após mudanças no schema
**Solução:** Regenerar cliente Prisma

```bash
docker exec ead-backend-dev pnpm run prisma:generate
docker exec ead-backend-dev pnpm run prisma:migrate
```

---

## Backup and Recovery

### Backup Checklist

Antes de mudanças importantes:

1. **Criar backup da imagem:**
   ```bash
   docker tag revalida-italia-back-backend:latest revalida-italia-back-backend:backup-$(date +%Y%m%d)
   ```

2. **Salvar arquivo:**
   ```bash
   docker save revalida-italia-back-backend:backup-$(date +%Y%m%d) | gzip > backup-$(date +%Y%m%d).tar.gz
   ```

3. **Testar backup:**
   ```bash
   docker load < backup-$(date +%Y%m%d).tar.gz
   ```

### Recovery Procedure

1. **Parar containers:**
   ```bash
   docker compose -f compose.dev.yaml down
   ```

2. **Restaurar backup:**
   ```bash
   docker load < revalida-backup-YYYYMMDD.tar.gz
   ```

3. **Iniciar containers:**
   ```bash
   docker compose -f compose.dev.yaml up -d
   ```

---

## Useful Commands

### Debugging
```bash
# Verificar containers
docker ps -a

# Logs detalhados
docker logs ead-backend-dev --tail=100 -f

# Entrar no container
docker exec -it ead-backend-dev sh

# Verificar espaço em disco
docker system df
```

### Cleanup
```bash
# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpar volumes órfãos
docker volume prune
```

---

## Notes

- Sempre documentar novos problemas encontrados
- Incluir data, contexto e solução que funcionou
- Manter seção de "tentativas que não funcionaram" para evitar repetição
- Fazer backup antes de mudanças significativas