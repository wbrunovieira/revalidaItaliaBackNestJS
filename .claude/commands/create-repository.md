---
description: Cria interface e implementações de repositório (Prisma e In-Memory)
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*)
argument-hint: [nome-do-repositorio]
---

# Criar Repositório Completo

## Contexto

Siga os padrões de desenvolvimento já carregados via `/exec-prompt` e analise a estrutura de repositórios existente.

### Arquivos de Referência para Análise:

- Interfaces: !`find src/domain -name "i-*.repository.ts" -type f | head -5`
- Implementações Prisma: !`find src/infra/database/prisma/repositories -name "*.repository.ts" | head -5`
- Implementações In-Memory: !`find src/test/repositories -name "in-memory-*.repository.ts" | head -5`

## Sua Tarefa

Crie o repositório completo para **$ARGUMENTS** com:

1. **Interface do Repositório**

   - Local: `src/domain/[dominio]/application/repositories/i-$ARGUMENTS.repository.ts`
   - Métodos padrão: create, findById, update, delete, findMany
   - Métodos específicos conforme necessidade

2. **Implementação Prisma**

   - Local: `src/infra/database/prisma/repositories/prisma-$ARGUMENTS.repository.ts`
   - Integração com Prisma Client
   - Mapeamento entidade ↔ modelo Prisma
   - Tratamento de erros

3. **Implementação In-Memory**
   - Local: `src/test/repositories/in-memory-$ARGUMENTS.repository.ts`
   - Array em memória para testes
   - Simulação de comportamentos do banco
   - Métodos auxiliares para testes

## Padrões a Seguir

### Interface do Repositório:

```typescript
export interface I[Nome]Repository {
  create(entity: Entity): Promise<void>
  findById(id: string): Promise<Entity | null>
  findMany(params?: FindManyParams): Promise<Entity[]>
  save(entity: Entity): Promise<void>
  delete(id: string): Promise<void>
  // Métodos específicos...
}
```
