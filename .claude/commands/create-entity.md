---
description: Cria uma nova entidade DDD seguindo os padrões do projeto
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*)
argument-hint: [nome-da-entidade]
---

# Criar Nova Entidade DDD

## Contexto

Siga os padrões de desenvolvimento já carregados via `/exec-prompt` e analise a estrutura existente do projeto.

### Arquivos de Referência para Análise:

- Entidades existentes: !`find src/domain -name "*.entity.ts" -type f | head -10`
- Schema do Prisma: @prisma/schema.prisma

## Sua Tarefa

Crie uma nova entidade DDD chamada **$ARGUMENTS** seguindo rigorosamente os padrões do projeto:

1. **Analise** as entidades existentes em `src/domain/*/enterprise/entities/*.entity.ts`
2. **Identifique** os padrões de:

   - Estrutura de pastas
   - Nomenclatura
   - Métodos comuns (create, update, etc.)
   - Validações
   - Value Objects utilizados
   - Eventos de domínio

3. **Implemente** a nova entidade com:

   - Propriedades tipadas
   - Métodos de criação estáticos
   - Validações de negócio
   - Getters/Setters apropriados
   - Eventos de domínio (se aplicável)

4. **Atualize** o schema.prisma com o novo modelo

## Diretrizes Importantes

- Aplique todas as práticas definidas no `/exec-prompt`
- Use TypeScript com tipagem forte
- Implemente validações no domínio, não apenas no banco
- **SEMPRE refatore completamente** o arquivo ao atualizá-lo
- Mantenha a consistência com outras entidades do projeto

## Checklist de Implementação

- [ ] Criar arquivo da entidade em `src/domain/[dominio]/enterprise/entities/[nome].entity.ts`
- [ ] Implementar interface/tipo da entidade
- [ ] Criar método estático de criação
- [ ] Adicionar validações de negócio
- [ ] Implementar getters/setters necessários
- [ ] Criar eventos de domínio (se aplicável)
- [ ] Atualizar schema.prisma
- [ ] Verificar imports e exports

## Perguntas Antes de Começar

Antes de implementar, confirme:

1. Qual o domínio/contexto desta entidade?
2. Quais as propriedades e seus tipos?
3. Quais validações de negócio são necessárias?
4. Há relacionamentos com outras entidades?
5. Precisa de eventos de domínio?
6. Alguma regra de negócio específica?

Aguarde as respostas antes de prosseguir com a implementação.
