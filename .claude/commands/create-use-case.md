---
description: Cria Use-Case completo com DTOs, validação Zod e testes
allowed-tools: FileEditor, Bash(*)
argument-hint: [nome-do-use-case]
---

# Criar Use-Case Completo

## Contexto

Siga os padrões de desenvolvimento já carregados via `/exec-prompt` e analise a estrutura de use-cases existente.

### Arquivos de Referência para Análise:

Execute os comandos abaixo para identificar exemplos:

```bash
# Use-Cases existentes
find src/domain -name "*.use-case.ts" -not -name "*.spec.ts" | head -5

# DTOs
find src/domain -name "*.dto.ts" | head -5

# Schemas de validação
find src/domain -path "*/validations/*.schema.ts" | head -5

# Testes
find src/domain -name "*.use-case.spec.ts" | head -5

# Repositórios disponíveis
find src/domain -name "i-*.repository.ts" | grep -E "(i-[^/]+\.repository\.ts)$"
Sua Tarefa
Crie um Use-Case completo para $ARGUMENTS incluindo:
1. DTOs (Request e Response)
typescript// [nome].dto.ts
export interface [Nome]UseCaseRequest {
  // propriedades tipadas
}

export interface [Nome]UseCaseResponse {
  // propriedades de retorno
}
2. Schema de Validação (Zod)
typescript// validations/[nome].schema.ts
import { z } from 'zod'

export const [nome]Schema = z.object({
  // validações detalhadas
})
3. Use-Case Implementation

Injeção de dependências via constructor
Validação com Zod
Lógica de negócio
Tratamento de erros apropriado

4. Testes Unitários Abrangentes
voce e um QA com muita experiencia.

✅ Caminho feliz
❌ Validações de entrada (campos obrigatórios, formatos)
🔍 Edge cases (limites, valores especiais)
🚫 Cenários de erro (entidade não encontrada, duplicação)
🔄 Estados e transições

🚨 PRINCÍPIO CRÍTICO DE TESTES

Quando testes falharem, SEMPRE corrija a implementação, NUNCA os testes!
Localização das Correções:

Validação de entrada → use-cases/validations/*.schema.ts
Lógica de negócio → application/use-cases/*.use-case.ts
Regras de domínio → enterprise/entities/*.entity.ts
Integração/Persistência → infra/database/prisma/repositories/*.ts

Checklist de Implementação

 Criar DTOs em src/domain/[dominio]/application/dtos/
 Criar schema Zod em validations/
 Implementar use-case com validação e lógica
 Criar teste unitário cobrindo todos os cenários
 Registrar no module correspondente
 Executar testes para validar

Estrutura do Teste
typescriptdescribe('[Nome]UseCase', () => {
  let sut: [Nome]UseCase
  let repository: InMemory[Entity]Repository

  beforeEach(() => {
    repository = new InMemory[Entity]Repository()
    sut = new [Nome]UseCase(repository)
  })

  it('should [expected behavior] when valid input', async () => {
    // Arrange
    // Act
    // Assert
  })

  it('should throw when required field is missing', async () => {
    // Test cada campo obrigatório
  })

  it('should handle edge case [description]', async () => {
    // Valores limites, casos especiais
  })

  it('should throw when [business rule] is violated', async () => {
    // Regras de negócio específicas
  })
})
Perguntas Antes de Começar

Qual a operação específica (create, update, delete, get, list)?
Quais campos são obrigatórios no request?
Quais validações de negócio são necessárias?
Precisa verificar unicidade ou duplicação?
Há regras de autorização ou permissão?
Quais erros específicos devem ser tratados?
O que deve retornar no response?

Após Implementar
1. Registrar no Module:
typescript// src/infra/http/modules/[dominio]/[dominio].module.ts
providers: [
  // ... outros providers
  [Nome]UseCase,
]
2. Executar Teste:
bashdocker exec -it ead-backend-dev sh -c "pnpm test src/domain/[dominio]/application/use-cases/[nome].use-case.spec.ts"
3. Verificar Cobertura:

Todos os caminhos cobertos
Validações testadas
Erros tratados
Edge cases considerados

Aguarde respostas sobre os requisitos específicos antes de implementar.
```
