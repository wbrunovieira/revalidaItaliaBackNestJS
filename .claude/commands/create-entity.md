---
description: Cria uma nova entidade DDD seguindo padrões estabelecidos e melhores práticas
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*), Read, Write, MultiEdit
argument-hint: [nome-da-entidade]
---

# Criar Nova Entidade DDD

## ⚠️ INSTRUÇÕES IMPORTANTES

Você está criando uma entidade DDD seguindo princípios de Clean Architecture. Este comando fornece padrões detalhados que DEVEM ser seguidos exatamente. Quando houver dúvidas sobre detalhes de implementação não cobertos aqui, você DEVE:

1. Analisar padrões existentes no código
2. Apresentar opções baseadas em melhores práticas DDD/Clean Architecture
3. Recomendar a melhor abordagem com justificativa
4. AGUARDAR confirmação do usuário antes de implementar

## 🚨 LEVANTAMENTO DE REGRAS DE NEGÓCIO

**FUNDAMENTAL**: Antes de QUALQUER implementação, você DEVE fazer um levantamento completo das regras de negócio da entidade. Isso é CRÍTICO para o sucesso da implementação.

### Perguntas Obrigatórias sobre Regras de Negócio:

```
Antes de criar a entidade $ARGUMENTS, preciso entender as regras de negócio:

1. PROPÓSITO DA ENTIDADE:
   - Qual o objetivo principal desta entidade no sistema?
   - Que problema de negócio ela resolve?

2. PROPRIEDADES E VALIDAÇÕES:
   - Quais campos/propriedades a entidade deve ter?
   - Quais são obrigatórios e quais são opcionais?
   - Que validações cada campo deve ter?
   - Existem limites (mínimo/máximo) para valores?

3. REGRAS DE NEGÓCIO ESPECÍFICAS:
   - Que operações a entidade pode realizar?
   - Existem estados/status que ela pode assumir?
   - Há regras de transição entre estados?
   - Existem cálculos ou derivações automáticas?

4. RELACIONAMENTOS:
   - Com quais outras entidades ela se relaciona?
   - Qual a natureza desses relacionamentos (1:1, 1:N, N:N)?
   - Existem regras de integridade referencial?

5. COMPORTAMENTOS ESPECIAIS:
   - A entidade deve emitir eventos em quais situações?
   - Existem ações que devem ser auditadas?
   - Há regras temporais (expiração, agendamento)?

6. RESTRIÇÕES DE NEGÓCIO:
   - Existem combinações únicas de campos?
   - Há limites de quantidade por usuário/conta?
   - Existem regras de autorização especiais?

Por favor, forneça estas informações para que eu possa criar uma entidade que realmente atenda às necessidades do negócio.
```

## Contexto

Este projeto segue Domain-Driven Design (DDD) com Clean Architecture. Todas as entidades devem aderir aos padrões estabelecidos documentados em `/docs/patterns/entity-pattern.md`.

### Arquivos de Referência para Análise:

```bash
# Ler o guia de padrões de entidade
cat docs/patterns/entity-pattern.md

# Analisar entidades existentes
find src/domain -name "*.entity.ts" -type f | head -10

# Verificar value objects existentes
find src/domain -name "*.vo.ts" -type f | head -10

# Revisar schema do Prisma
cat prisma/schema.prisma
```

## Passos para Criação da Entidade

### 1. Determinar Contexto de Domínio

Primeiro, identifique o bounded context para a entidade **$ARGUMENTS**:

- Faz parte do domínio `auth`? (usuários, autenticação, autorização)
- Faz parte do domínio `course-catalog`? (cursos, módulos, aulas, vídeos)
- É um novo bounded context?

### 2. Analisar Propriedades da Entidade

Antes de implementar, determine:

1. **Quais propriedades precisam de Value Objects?**
   - Propriedades com regras de validação → Criar VO
   - Propriedades com comportamento de negócio → Criar VO
   - Propriedades com formatação/transformação → Criar VO
   - Strings/números simples sem regras → Manter como primitivo

2. **Quais eventos de domínio são necessários?**
   - Criação da entidade → `[Entidade]CreatedEvent`
   - Mudanças de estado importantes → `[Entidade][Estado]ChangedEvent`
   - Marcos de negócio → `[Entidade][Marco]Event`

### 3. Estrutura de Arquivos

Crie a entidade seguindo esta estrutura:

```
src/
└── domain/
    └── [contexto-limitado]/
        └── enterprise/
            ├── entities/
            │   └── $ARGUMENTS.entity.ts
            ├── value-objects/
            │   └── [novo-vo-se-necessario].vo.ts
            └── events/
                └── $ARGUMENTS-created.event.ts
```

### 4. Padrão de Implementação da Entidade

```typescript
// src/domain/[contexto]/enterprise/entities/$ARGUMENTS.entity.ts

import { AggregateRoot } from '@/core/domain/aggregate-root';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

// Importar eventos e VOs
import { ${ARGUMENTS}CreatedEvent } from '../events/$ARGUMENTS-created.event';
// Importar Value Objects necessários

// =====================================
// = Interfaces
// =====================================

/**
 * Props internas - usa Value Objects
 */
interface ${ARGUMENTS}Props {
  // Propriedades com VOs
  // Propriedades como primitivos
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props para criação - recebe primitivos
 */
export interface Create${ARGUMENTS}Props {
  // Todas as propriedades como primitivos
  // Campos de auditoria opcionais
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================
// = Entity
// =====================================

/**
 * ${ARGUMENTS} Aggregate Root
 * 
 * [Descrever o propósito e responsabilidade da entidade]
 */
export class ${ARGUMENTS} extends AggregateRoot<${ARGUMENTS}Props> {
  // ===== Response Methods =====
  
  toResponseObject(): Create${ARGUMENTS}Props & { id: string } {
    // Converter VOs para primitivos
    // Retornar todas as propriedades para resposta da API
  }

  // ===== Getters =====
  
  // Um getter por propriedade
  // Retornar VOs para propriedades VO
  // Retornar primitivos para propriedades primitivas

  // ===== Private Methods =====
  
  private touch() {
    this.props.updatedAt = new Date();
  }

  // ===== Public Methods =====
  
  // Métodos de lógica de negócio
  // Sempre chamar this.touch() após modificações

  // ===== Static Factory Methods =====
  
  public static create(
    props: Optional<Create${ARGUMENTS}Props, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    const now = new Date();
    
    // Converter primitivos para VOs
    const ${ARGUMENTS.toLowerCase()}Props: ${ARGUMENTS}Props = {
      ...props,
      // Converter cada primitivo para seu VO
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
    
    const ${ARGUMENTS.toLowerCase()} = new ${ARGUMENTS}(${ARGUMENTS.toLowerCase()}Props, id);

    // Adicionar evento de domínio para novas entidades
    const isNew${ARGUMENTS} = !id;
    if (isNew${ARGUMENTS}) {
      ${ARGUMENTS.toLowerCase()}.addDomainEvent(new ${ARGUMENTS}CreatedEvent(${ARGUMENTS.toLowerCase()}));
    }

    return ${ARGUMENTS.toLowerCase()};
  }
}
```

### 5. Padrão de Value Object (se necessário)

```typescript
// src/domain/[contexto]/enterprise/value-objects/[nome-vo].vo.ts

// =====================================
// = Constants
// =====================================

// Definir constantes de validação aqui

// =====================================
// = Value Object
// =====================================

/**
 * [Nome do VO] Value Object
 * 
 * [Descrever propósito e regras]
 * 
 * @example
 * const vo = NomeVo.create('valor');
 * console.log(vo.value);
 */
export class NomeVo {
  constructor(public readonly value: string) {
    this.validate();
  }

  // ===== Private Methods =====

  private validate(): void {
    // Lógica de validação
  }

  // ===== Public Methods =====

  equals(other: NomeVo): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // ===== Static Factory Methods =====

  static create(value: string): NomeVo {
    return new NomeVo(value);
  }
}
```

### 6. Padrão de Evento de Domínio (se necessário)

```typescript
// src/domain/[contexto]/enterprise/events/$ARGUMENTS-created.event.ts

import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ${ARGUMENTS} } from '../entities/$ARGUMENTS.entity';

export class ${ARGUMENTS}CreatedEvent implements DomainEvent {
  public occurredAt: Date;
  public entityId: UniqueEntityID;

  constructor(public readonly ${ARGUMENTS.toLowerCase()}: ${ARGUMENTS}) {
    this.occurredAt = new Date();
    this.entityId = ${ARGUMENTS.toLowerCase()}.id;
  }

  getAggregateId(): UniqueEntityID {
    return this.entityId;
  }
}
```

### 7. Atualizar Schema do Prisma

Adicione o modelo em `prisma/schema.prisma`:

```prisma
model ${ARGUMENTS} {
  id            String   @id @default(uuid())
  // Adicionar campos correspondentes às propriedades da entidade
  // Usar tipos e constraints apropriados
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("${ARGUMENTS.toLowerCase()}s")
}
```

## Regras de Organização do Código

1. **Separadores de Seção**:
   ```typescript
   // =====================================
   // = Nome da Seção
   // =====================================
   ```

2. **Separadores de Seção de Métodos**:
   ```typescript
   // ===== Nome da Seção =====
   ```

3. **Ordem dos Métodos** (DEVE seguir):
   1. Métodos de Response/Serialização
   2. Getters
   3. Métodos privados
   4. Métodos públicos (lógica de negócio)
   5. Métodos factory estáticos

4. **Espaçamento**:
   - 1 linha em branco entre grupos de imports
   - 1 linha em branco entre métodos
   - 2 linhas em branco antes de seções principais

## Exemplos de Validação

### Validação de Email (Value Object)
```typescript
private validate(): void {
  const normalizedEmail = this.value.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Formato de email inválido');
  }
}
```

### Validação de Campo Obrigatório
```typescript
if (!props.nome || props.nome.trim().length === 0) {
  throw new Error('Nome é obrigatório');
}
```

### Validação de Regra de Negócio
```typescript
if (props.preco < 0) {
  throw new Error('Preço não pode ser negativo');
}
```

## Padrões Comuns por Tipo de Entidade

### Entidades tipo Usuário
- Email → Value Object
- Senha → Primitivo (tratado pela camada de auth)
- Papel/Permissões → Value Object
- Campos de perfil → Mix de primitivos e VOs

### Entidades de Produto/Curso
- Preço → Value Object (se regras complexas de precificação)
- Status → Value Object (se máquina de estados)
- Traduções → Value Object
- Metadados → Primitivos ou JSON

### Entidades de Transação
- Valor → Value Object
- Status → Value Object
- Timestamps → Primitivos
- Referências → Value Objects ou primitivos

## Pontos de Decisão que Requerem Confirmação

Antes de implementar, você DEVE perguntar para confirmação sobre:

1. **Contexto de Domínio**: "Esta entidade deve ficar no contexto [contexto-sugerido], ou você prefere uma organização diferente?"

2. **Value Objects**: "Identifiquei estas propriedades como candidatas para Value Objects: [lista]. Devo criar VOs para todas elas, ou você prefere algumas como primitivos?"

3. **Eventos de Domínio**: "Devemos emitir estes eventos: [lista], ou existem outros eventos de negócio que devemos capturar?"

4. **Métodos de Negócio**: "Quais operações de negócio esta entidade deve suportar além do CRUD básico?"

5. **Regras de Validação**: "Quais regras de validação devem ser aplicadas no nível de domínio?"

6. **Relacionamentos**: "Existem relacionamentos com outras entidades que devemos considerar?"

## Exemplo de Perguntas de Implementação

Para uma entidade `Produto`, pergunte:

```
Vou criar a entidade Produto. Antes de implementar, preciso confirmar:

1. REGRAS DE NEGÓCIO:
   - Qual o ciclo de vida de um produto?
   - Produtos podem ser desativados ou apenas excluídos?
   - Existe controle de estoque?
   - Há variações de produto (tamanho, cor)?

2. Contexto de Domínio: 
   - Deve ficar em um novo contexto 'catalogo' ou parte de 'course-catalog'?

3. Candidatos a Value Objects:
   - preco: Criar VO Money com suporte a moeda?
   - sku: Criar VO SKU com validação de formato?
   - status: Criar VO StatusProduto com transições de estado?

4. Eventos de Domínio:
   - ProdutoCriadoEvent
   - PrecoAlteradoEvent
   - StatusProdutoAlteradoEvent
   
   Estes são apropriados?

5. Métodos de negócio necessários:
   - atualizarPreco(novoPreco)
   - alterarStatus(novoStatus)
   - adicionarCategoria(categoriaId)
   
   Algum outro?

6. Regras de validação:
   - Preço deve ser >= 0
   - SKU deve ser único
   - Nome obrigatório, máx 255 caracteres
   
   Regras adicionais?

Por favor, confirme ou ajuste estas decisões antes de eu prosseguir.
```

## Checklist Final

- [ ] Regras de negócio completamente levantadas
- [ ] Contexto de domínio identificado
- [ ] Propriedades analisadas para candidatos a VO
- [ ] Interface de props internas com VOs criada
- [ ] Interface de props externas com primitivos criada
- [ ] Entidade estende AggregateRoot
- [ ] Método toResponseObject() implementado
- [ ] Todos os getters implementados
- [ ] Método touch() para atualizações
- [ ] Métodos de negócio com validação adequada
- [ ] Método factory estático create()
- [ ] Eventos de domínio criados e disparados
- [ ] Value Objects criados com validação
- [ ] Schema do Prisma atualizado
- [ ] Todas as seções organizadas corretamente
- [ ] Documentação JSDoc adicionada
- [ ] Imports organizados corretamente

## Prevenção de Erros

1. **Nunca** misture VOs e primitivos na mesma interface
2. **Sempre** valide nos VOs, não na entidade
3. **Sempre** converta VOs para primitivos em toResponseObject()
4. **Nunca** dispare eventos fora do método create()
5. **Sempre** use touch() ao modificar propriedades
6. **Nunca** exponha coleções mutáveis diretamente

## Template de Levantamento Inicial

```
Antes de criar a entidade $ARGUMENTS, vou fazer o levantamento de regras de negócio:

[COPIAR AS PERGUNTAS OBRIGATÓRIAS DE REGRAS DE NEGÓCIO AQUI]

Após receber estas informações, apresentarei:
1. Estrutura proposta da entidade
2. Value Objects identificados
3. Eventos de domínio sugeridos
4. Métodos de negócio recomendados

Aguardo suas respostas para prosseguir com a implementação seguindo as melhores práticas de DDD.
```

Lembre-se: Quando houver incerteza sobre qualquer detalhe de implementação, PARE e peça esclarecimento com opções concretas baseadas em melhores práticas DDD.