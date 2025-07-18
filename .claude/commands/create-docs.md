---
description: Analisa e documenta rotas existentes com Swagger, corrigindo problemas de segurança e completude
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*), Bash(docker exec:*)
argument-hint: [nome-do-controller] [nome-da-rota]
---

# Documentar e Corrigir Rota Existente

## Contexto

Este comando analisa rotas existentes, identifica problemas de segurança e completude, sugere correções e implementa documentação Swagger completa seguindo os padrões estabelecidos.

## Processo de Execução

### 1. FASE DE ANÁLISE

#### 1.1 Localizar e Analisar Controller
```bash
# Encontrar o controller
find src/infra/controllers -name "*$ARGUMENTS*.controller.ts" | head -5

# Analisar a rota específica
```

Identificar:
- [ ] Qual verbo HTTP está usando
- [ ] Quais status codes está retornando
- [ ] Como está tratando erros do use case
- [ ] Se tem alguma documentação Swagger existente
- [ ] Guards de autenticação/autorização

#### 1.2 Analisar Use Case Correspondente

```bash
# Localizar use case
find src/domain -name "*use-case.ts" | grep -i "$ARGUMENTS"
```

Mapear TODOS os erros possíveis:
- [ ] Erros de validação (Zod, class-validator)
- [ ] Erros de negócio (custom errors)
- [ ] Erros de repositório (not found, duplicates)
- [ ] Erros de serviços externos
- [ ] Edge cases não tratados

#### 1.3 Análise de Segurança

Verificar se o controller está:
- [ ] Expondo mensagens de validação sensíveis (ex: "senha muito curta")
- [ ] Revelando existência de recursos (ex: "email já cadastrado")
- [ ] Expondo stack traces ou detalhes internos
- [ ] Retornando informações desnecessárias nos erros

#### 1.4 Análise de Completude

Identificar:
- [ ] Erros do use case NÃO tratados no controller
- [ ] Status HTTP incorretos para os tipos de erro
- [ ] Falta de tratamento para casos edge
- [ ] Cenários de erro faltantes baseados no contexto

### 2. FASE DE PROPOSTA

Apresentar ao usuário:

```markdown
## 🔍 Análise da Rota: [NOME]

### 📊 Mapeamento de Erros

**Erros do Use Case:**
1. `ValidationError` - [descrição]
2. `NotFoundError` - [descrição]
3. `BusinessRuleError` - [descrição]

**Tratamento Atual no Controller:**
- ✅ `NotFoundError` → 404
- ❌ `ValidationError` → Expondo detalhes
- ⚠️ `BusinessRuleError` → Não tratado

### 🚨 Problemas de Segurança Encontrados

1. **Exposição de Validação**
   - Atual: `"Password must be at least 6 characters"`
   - Proposto: `"Invalid credentials"`

2. **Revelação de Existência**
   - Atual: `"Email already exists"`
   - Proposto: `"Invalid request"`

### 📋 Melhorias Propostas

1. **Novos Tratamentos de Erro:**
   - Adicionar tratamento para `BusinessRuleError` → 422
   - Adicionar rate limiting → 429
   - Adicionar tratamento genérico → 500

2. **Correções de Segurança:**
   - Genericizar mensagens de autenticação
   - Ocultar detalhes de validação sensíveis
   - Adicionar trace ID para debugging

3. **Documentação Swagger Completa:**
   - DTOs de request/response
   - Todos os status codes
   - Exemplos realistas
   - Contexto de negócio

### 🔧 Alterações no Controller

[Mostrar código atual vs proposto]

Deseja prosseguir com as correções? (s/n)
```

### 3. FASE DE IMPLEMENTAÇÃO

Após aprovação, executar em ordem:

#### 3.1 Criar/Atualizar DTOs

```typescript
// Request DTO com validação e Swagger
export class [Nome]RequestDto {
  @ApiProperty({
    example: '[exemplo realista]',
    description: '[descrição clara]',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  field: string;
}

// Response DTOs para sucesso e erros
export class [Nome]ResponseDto { ... }
export class [Nome]ErrorResponseDto { ... }
```

#### 3.2 Atualizar Controller

```typescript
@ApiTags('[Domain]')
@Controller('[route]')
export class [Nome]Controller {
  
  @ApiOperation({ 
    summary: '[Ação concisa]',
    description: `
      [Descrição detalhada incluindo]:
      
      ## Funcionalidade
      - O que este endpoint faz
      - Quando deve ser usado
      
      ## Regras de Negócio
      - [Regra 1]
      - [Regra 2]
      
      ## Controle de Acesso
      - Roles permitidas: [roles]
      - Restrições: [restrições]
      
      ## Rate Limiting
      - [X] requisições por [período]
      
      ## Próximos Passos
      - [Endpoint relacionado 1]
      - [Endpoint relacionado 2]
    `
  })
  @ApiBody({ 
    type: [Nome]RequestDto,
    description: '[Descrição]',
    examples: {
      [exemplo1]: { ... },
      [exemplo2]: { ... }
    }
  })
  @ApiResponse({ 
    status: [200/201],
    description: '[Sucesso]',
    type: [Nome]ResponseDto,
  })
  @ApiResponse({ 
    status: 400,
    description: 'Validation error',
    type: ValidationErrorDto,
  })
  @ApiResponse({ 
    status: 401,
    description: 'Authentication required',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({ 
    status: 403,
    description: 'Insufficient permissions',
    type: ForbiddenErrorDto,
  })
  @ApiResponse({ 
    status: 404,
    description: 'Resource not found',
    type: NotFoundErrorDto,
  })
  @ApiResponse({ 
    status: 422,
    description: 'Business rule violation',
    type: BusinessErrorDto,
  })
  @ApiBearerAuth()
  @[HttpVerb]('[endpoint]')
  async handle(@Body() dto: [Nome]RequestDto) {
    const result = await this.useCase.execute(dto);
    
    if (result.isLeft()) {
      const error = result.value;
      
      // Tratamento seguro de erros
      if (error instanceof ValidationError) {
        // Para erros de autenticação, sempre genérico
        if (this.isAuthRelated(error)) {
          throw new UnauthorizedException('Invalid credentials');
        }
        throw new BadRequestException(error.message);
      }
      
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Resource not found');
      }
      
      if (error instanceof BusinessRuleError) {
        throw new UnprocessableEntityException({
          type: 'https://api.revalidaitalia.com/errors/business-rule',
          title: 'Business Rule Violation',
          status: 422,
          detail: error.message,
          instance: request.url,
          traceId: generateTraceId(),
        });
      }
      
      // Erro genérico para não expor detalhes
      throw new InternalServerErrorException('An error occurred');
    }
    
    return result.value;
  }
}
```

### 4. FASE DE VALIDAÇÃO

#### 4.1 Executar Testes Existentes

```bash
# Testes unitários do use case
docker exec -it ead-backend-dev sh -c "pnpm test src/domain/*/application/use-cases/*$ARGUMENTS*.spec.ts"

# Testes do controller
docker exec -it ead-backend-dev sh -c "pnpm test src/infra/controllers/tests/*$ARGUMENTS*.spec.ts"

# Testes E2E
docker exec -it ead-backend-dev sh -c "pnpm test:e2e test/e2e/*$ARGUMENTS*.e2e.spec.ts"
```

#### 4.2 Corrigir Quebras

Se algum teste falhar após as mudanças:
1. Analisar o motivo da falha
2. Ajustar a implementação (nunca o teste!)
3. Re-executar até passar

#### 4.3 Adicionar Novos Testes

Para cada novo cenário de erro tratado:

```typescript
// No teste do controller
it('should return 422 when business rule violated', async () => {
  const error = new BusinessRuleError('Cannot perform action');
  jest.spyOn(useCase, 'execute').mockResolvedValue(left(error));
  
  await request(app.getHttpServer())
    .post('/route')
    .send(validData)
    .expect(422)
    .expect(res => {
      expect(res.body.type).toBe('https://api.revalidaitalia.com/errors/business-rule');
      expect(res.body.detail).toBe('Cannot perform action');
    });
});

// Para segurança
it('should return generic message for auth errors', async () => {
  const error = new ValidationError('Email not found');
  jest.spyOn(useCase, 'execute').mockResolvedValue(left(error));
  
  await request(app.getHttpServer())
    .post('/auth/route')
    .send(credentials)
    .expect(401)
    .expect(res => {
      expect(res.body.message).toBe('Invalid credentials');
      expect(res.body.message).not.toContain('not found');
    });
});
```

### 5. CHECKLIST FINAL

Antes de finalizar, verificar:

#### Segurança
- [ ] Nenhuma mensagem expõe detalhes de validação sensíveis
- [ ] Erros de autenticação são genéricos
- [ ] Não há vazamento de informações do sistema
- [ ] Trace IDs implementados para debugging

#### Completude
- [ ] Todos os erros do use case estão tratados
- [ ] Status HTTP corretos para cada tipo de erro
- [ ] Casos edge cobertos
- [ ] Rate limiting documentado (se aplicável)

#### Documentação
- [ ] @ApiTags correto
- [ ] @ApiOperation com descrição completa
- [ ] @ApiBody com exemplos múltiplos
- [ ] @ApiResponse para TODOS os status possíveis
- [ ] DTOs com @ApiProperty em todos os campos
- [ ] Exemplos realistas (não "test123")
- [ ] Contexto de negócio explicado
- [ ] Próximos passos documentados

#### Testes
- [ ] Todos os testes existentes passando
- [ ] Novos testes para novos cenários
- [ ] Testes de segurança adicionados
- [ ] Coverage adequado

## Exemplo de Execução

```bash
# Para documentar a rota de criação de usuário
/create-docs user create

# Para documentar a rota de listagem de cursos  
/create-docs course list

# Para documentar a rota de atualização de vídeo
/create-docs video update
```

## Padrões de Mensagens por Contexto

### Autenticação/Autorização
- Sempre usar: "Invalid credentials" ou "Authentication failed"
- Nunca expor: "User not found", "Wrong password", "Account disabled"

### Recursos Não Encontrados
- Público: "Resource not found"
- Admin: Pode incluir ID - "Course 123 not found"

### Validação
- Campos gerais: Pode ser específico - "Name is required"
- Campos sensíveis: Genérico - "Invalid request"

### Regras de Negócio
- Ser claro mas sem expor lógica interna
- ✅ "Cannot enroll: Course is full"
- ❌ "Cannot enroll: 50/50 students (max defined in COURSE_LIMITS)"

## Observações Importantes

1. **Sempre priorize segurança sobre clareza** em mensagens de erro
2. **Mantenha consistência** com outras rotas do mesmo domínio
3. **Documente pensando em quem não conhece** o sistema
4. **Teste manualmente** no Swagger UI após implementar
5. **Considere o contexto** - rotas públicas vs autenticadas

Aguarde a análise completa antes de aprovar as mudanças!