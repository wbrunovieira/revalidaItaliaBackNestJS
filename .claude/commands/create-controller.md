---
description: Cria Controller completo com testes e configurações
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*), Bash(docker exec:*)
argument-hint: [nome-do-controller] [verbo-http]
---

# Criar Controller e Testes

## Contexto

Siga os padrões de desenvolvimento já carregados via `/exec-prompt` e analise a estrutura de controllers existente.

### Arquivos de Referência para Análise:

- Controllers: !`find src/infra/controllers -name "*.controller.ts" | head -5`
- Modules: !`find src/infra/http/modules -name "*.module.ts" | head -5`
- Testes: !`find src/infra/controllers/tests -name "*.spec.ts" | head -5`
- Request files: !`find requests -name "*.http" | head -5`

## Sua Tarefa

Crie um Controller completo para **$ARGUMENTS** incluindo:

### 1. Controller com Validações e Documentação Swagger

````typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('[Tag Name]') // Ex: 'Users', 'Courses', 'Videos'
@Controller('[route]')
export class [Nome]Controller {
  constructor(private readonly useCase: [Nome]UseCase) {}

  @ApiOperation({ 
    summary: '[Ação concisa]', // Ex: 'Create new user'
    description: `[Descrição detalhada incluindo]:
      - O que o endpoint faz
      - Regras de negócio importantes
      - Requisitos de autenticação/autorização
      - Rate limiting se aplicável
      - Próximos passos após sucesso
    `
  })
  @ApiBody({ /* configuração específica por verbo */ })
  @ApiResponse({ /* respostas padronizadas */ })
  @[HttpVerb]('[endpoint]')
  async handle(@Body() body: [Nome]Dto): Promise<HttpResponse> {
    // Implementação
  }
}
````

### 2. DTOs com Swagger e Class-Validator

#### Request DTOs
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class Create[Nome]Dto {
  @ApiProperty({
    example: 'valor exemplo realista',
    description: 'Descrição clara do campo e suas regras',
    required: true,
    minLength: 6, // se aplicável
  })
  @IsString()
  @IsNotEmpty()
  field: string;
}
```

#### Response DTOs (OBRIGATÓRIO para boa documentação)
```typescript
// Success Response
export class [Nome]ResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'valor exemplo',
    description: 'Descrição do campo',
  })
  field: string;
}

// Error Response (seguir RFC 7807)
export class [Nome]ErrorResponseDto {
  @ApiProperty({
    example: 'https://api.revalidaitalia.com/errors/[error-type]',
    description: 'URI reference that identifies the problem type',
  })
  type: string;

  @ApiProperty({
    example: '[Error Title]',
    description: 'Short, human-readable summary',
  })
  title: string;

  @ApiProperty({ example: 400 })
  status: number;

  @ApiProperty({
    example: 'Detailed error message',
    description: 'Human-readable explanation',
  })
  detail: string;

  @ApiProperty({ example: '/[route]' })
  instance: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Trace ID for support',
  })
  traceId: string;
}
```

## 📚 GUIA DE PADRÕES DE DOCUMENTAÇÃO SWAGGER

### 🎯 Princípios Fundamentais
1. **Segurança First**: Nunca exponha detalhes de validação em erros de autenticação
2. **Developer Experience**: Exemplos realistas, não "test123"
3. **Contexto de Negócio**: Explique o "por quê", não apenas o "como"
4. **Próximos Passos**: Sempre indique o que fazer após sucesso

### 📋 Checklist Obrigatório para TODA Rota

- [ ] **@ApiTags**: Tag consistente com o domínio
- [ ] **@ApiOperation**: Summary + Description detalhada
- [ ] **@ApiBearerAuth**: Se requer autenticação
- [ ] **DTOs de Request**: Com @ApiProperty e exemplos realistas
- [ ] **DTOs de Response**: Sucesso E erro (RFC 7807)
- [ ] **Exemplos múltiplos**: Cenários válidos e inválidos
- [ ] **Status codes**: Todos os possíveis com descrição
- [ ] **Rate limiting**: Documentar se aplicável
- [ ] **Próximos passos**: Links para endpoints relacionados

### 🔧 Padrões por Verbo HTTP

#### GET - Buscar Recursos
```typescript
@ApiOperation({ 
  summary: 'Get [resource] by ID',
  description: `
    Retrieves detailed information about a specific [resource].
    
    ## Access Control
    - Students: Can only access their own resources
    - Instructors: Can access resources in their courses
    - Admins: Full access
    
    ## Response Includes
    - Basic [resource] information
    - Related entities (if expanded)
    - Computed fields (e.g., progress, completion)
    
    ## Performance Notes
    - Results are cached for 5 minutes
    - Use If-None-Match header for conditional requests
  `
})
@ApiParam({
  name: 'id',
  description: '[Resource] unique identifier (UUID v4)',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiQuery({
  name: 'expand',
  required: false,
  description: 'Comma-separated list of relations to include',
  example: 'user,course,progress',
})
@ApiResponse({ 
  status: 200, 
  description: '[Resource] found successfully',
  type: [Nome]ResponseDto,
})
@ApiResponse({ 
  status: 404, 
  description: '[Resource] not found',
  type: NotFoundErrorDto,
})
@ApiBearerAuth()
@Get(':id')
```

#### GET (List) - Listar Recursos
```typescript
@ApiOperation({ 
  summary: 'List [resources] with pagination',
  description: `
    Returns a paginated list of [resources] with optional filtering and sorting.
    
    ## Filtering
    - By status: ?status=active,pending
    - By date: ?createdAfter=2024-01-01
    - By search: ?search=keyword
    
    ## Sorting
    - Default: createdAt DESC
    - Options: name, date, status
    
    ## Pagination
    - Default page size: 20
    - Maximum page size: 100
  `
})
@ApiQuery({
  name: 'page',
  required: false,
  description: 'Page number (1-indexed)',
  example: 1,
  type: Number,
})
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Items per page (max: 100)',
  example: 20,
  type: Number,
})
@ApiQuery({
  name: 'sort',
  required: false,
  description: 'Sort field and direction',
  example: 'createdAt:desc',
  enum: ['name:asc', 'name:desc', 'createdAt:asc', 'createdAt:desc'],
})
@ApiResponse({ 
  status: 200, 
  description: 'List retrieved successfully',
  type: Paginated[Nome]ResponseDto,
})
```

#### POST - Criar Recurso
```typescript
@ApiOperation({ 
  summary: 'Create new [resource]',
  description: `
    Creates a new [resource] with the provided data.
    
    ## Validation Rules
    - [Field1]: Required, must be unique
    - [Field2]: Optional, max 255 characters
    - [Field3]: Must be a valid enum value
    
    ## Business Rules
    - [Specific business rule 1]
    - [Specific business rule 2]
    
    ## After Creation
    - Resource is immediately available
    - Webhook notifications are sent (if configured)
    - Related resources are updated
    
    ## Next Steps
    - GET /[resources]/{id} - View created resource
    - PUT /[resources]/{id} - Update resource
    - POST /[resources]/{id}/activate - Activate resource
  `
})
@ApiBody({ 
  type: Create[Nome]Dto,
  description: '[Resource] data to create',
  examples: {
    complete: {
      summary: 'Complete example',
      description: 'All fields populated',
      value: {
        name: 'Example Name',
        description: 'Detailed description',
        status: 'active'
      }
    },
    minimal: {
      summary: 'Minimal example',
      description: 'Only required fields',
      value: {
        name: 'Example Name'
      }
    }
  }
})
@ApiResponse({ 
  status: 201, 
  description: '[Resource] created successfully',
  type: [Nome]ResponseDto,
  headers: {
    Location: {
      description: 'URL of created resource',
      schema: { type: 'string', example: '/[resources]/550e8400-e29b-41d4-a716-446655440000' }
    }
  }
})
@ApiResponse({ 
  status: 400, 
  description: 'Validation error',
  type: ValidationErrorDto,
})
@ApiResponse({ 
  status: 409, 
  description: 'Conflict - resource already exists',
  type: ConflictErrorDto,
})
```

#### PUT/PATCH - Atualizar Recurso
```typescript
@ApiOperation({ 
  summary: 'Update [resource]',
  description: `
    Updates an existing [resource]. 
    ${isPatch ? 'Partial updates allowed - only send fields to change.' : 'Full replacement - all fields required.'}
    
    ## Updatable Fields
    - name: Change display name
    - description: Update description
    - status: Change status (see allowed transitions)
    
    ## Non-Updatable Fields
    - id: Immutable
    - createdAt: Immutable
    - createdBy: Immutable
    
    ## Status Transitions
    - draft → published (requires admin)
    - published → archived (requires owner or admin)
    - archived → published (requires admin)
    
    ## Validation
    - Same rules as creation apply
    - Additional transition rules may apply
    
    ## Side Effects
    - Modified timestamp updated
    - Audit log entry created
    - Cache invalidated
  `
})
@ApiParam({
  name: 'id',
  description: '[Resource] ID to update',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiBody({ 
  type: Update[Nome]Dto,
  description: `[Resource] data to update ${isPatch ? '(partial)' : '(complete)'}`,
  examples: {
    updateName: {
      summary: 'Update name only',
      value: { name: 'New Name' }
    },
    updateStatus: {
      summary: 'Change status',
      value: { status: 'published' }
    }
  }
})
@ApiResponse({ 
  status: 200, 
  description: '[Resource] updated successfully',
  type: [Nome]ResponseDto,
})
@ApiResponse({ 
  status: 404, 
  description: '[Resource] not found',
  type: NotFoundErrorDto,
})
@ApiResponse({ 
  status: 422, 
  description: 'Invalid state transition',
  type: BusinessRuleErrorDto,
})
```

#### DELETE - Remover Recurso
```typescript
@ApiOperation({ 
  summary: 'Delete [resource]',
  description: `
    Permanently deletes a [resource] and all associated data.
    
    ## Delete Behavior
    - ${isSoftDelete ? 'Soft delete - marked as deleted but retained' : 'Hard delete - permanently removed'}
    - Related entities: ${cascadeBehavior}
    
    ## Prerequisites
    - No active dependencies
    - User must be owner or admin
    - Resource must be in deletable state
    
    ## Alternatives
    Consider these before deletion:
    - PUT /[resources]/{id} with status: 'archived' - Soft removal
    - PUT /[resources]/{id} with active: false - Deactivation
    
    ## Warning
    This action cannot be undone. All related data will be affected.
  `
})
@ApiParam({
  name: 'id',
  description: '[Resource] ID to delete',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiResponse({ 
  status: 204, 
  description: '[Resource] deleted successfully',
})
@ApiResponse({ 
  status: 404, 
  description: '[Resource] not found',
  type: NotFoundErrorDto,
})
@ApiResponse({ 
  status: 409, 
  description: 'Cannot delete - has active dependencies',
  type: ConflictErrorDto,
  examples: {
    hasDependencies: {
      summary: 'Has active dependencies',
      value: {
        type: 'https://api.revalidaitalia.com/errors/has-dependencies',
        title: 'Resource Has Dependencies',
        status: 409,
        detail: 'Cannot delete course with enrolled students',
        instance: '/courses/123',
        dependencies: {
          students: 45,
          lessons: 12
        }
      }
    }
  }
})
```

### 🔒 Padrões de Segurança

#### Autenticação
```typescript
// Para rotas autenticadas
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

// Para rotas públicas
@Public()

// Para roles específicas
@Roles('admin', 'instructor')
@UseGuards(RolesGuard)
```

#### Mensagens de Erro
```typescript
// NUNCA expor detalhes em erros de autenticação
❌ "Email not found"
❌ "Password must be at least 6 characters"
✅ "Invalid credentials"

// Para outros erros, ser específico ajuda
✅ "Course is full (50/50 students)"
✅ "Cannot delete course with active enrollments"
```

### 📊 Exemplos Realistas por Domínio

#### Auth/Users
- Emails: mario.rossi@medicina.it, admin@revalidaitalia.com
- Nomes: Mario Rossi, Giulia Bianchi
- Roles: student, instructor, admin

#### Courses
- Títulos: "Anatomia Humana I", "Fisiologia Cardiovascular"
- Códigos: "MED-101", "MED-205"
- Status: draft, published, archived

#### Videos
- Títulos: "Introdução ao Sistema Nervoso", "Aula 3 - Sinapse Neural"
- Durações: 1800 (30 min), 3600 (1 hora)
- Providers: pandavideo, youtube, vimeo

### 3. Module Configuration

```typescript
@Module({
  controllers: [[Nome]Controller],
  providers: [
    [Nome]UseCase,
    {
      provide: 'I[Entity]Repository',
      useClass: Prisma[Entity]Repository,
    },
  ],
})
export class [Nome]Module {}
```
### 4. Estrutura de Testes

Criar em `src/infra/controllers/tests/[controller-name]/`:

```
shared/
  [nome]-controller-test-setup.ts    # Configuração de mocks
  [nome]-controller-test-helpers.ts  # Helpers para testes
  [nome]-controller-test-data.ts     # Dados de teste
```

Testes por verbo HTTP:
- `get-[nome].controller.spec.ts`
- `post-[nome].controller.spec.ts`
- `put-[nome].controller.spec.ts`
- `delete-[nome].controller.spec.ts`

### 5. Request File

Criar/atualizar `requests/[controller-name].http`:

```http
### Create [Entity]
POST {{BASE_URL}}/[route]
Content-Type: application/json
Authorization: Bearer {{TOKEN}}

{
  "field": "value"
}

### Get [Entity]
GET {{BASE_URL}}/[route]/{{id}}
Authorization: Bearer {{TOKEN}}

### Update [Entity]
PUT {{BASE_URL}}/[route]/{{id}}
Content-Type: application/json
Authorization: Bearer {{TOKEN}}

{
  "field": "updated value"
}

### Delete [Entity]
DELETE {{BASE_URL}}/[route]/{{id}}
Authorization: Bearer {{TOKEN}}
```
🚨 PRINCÍPIO CRÍTICO DE TESTES
Quando testes falharem, SEMPRE corrija a implementação, NUNCA os testes!
Localização das Correções:

Validação de entrada → controllers/dtos/*.dto.ts
Mapeamento de dados → controllers/*.controller.ts
Tratamento de erros → filters/*.filter.ts
Status HTTP → Controller methods

Checklist de Implementação

 Criar Controller em src/infra/controllers/
 Criar/atualizar DTOs com validações
 Verificar/criar Module e registrar providers
 Criar estrutura de testes com shared/
 Implementar testes por verbo HTTP
 Criar/atualizar arquivo .http
 Adicionar em dev-setup se necessário
 Executar testes

Estrutura do Teste
typescriptdescribe('[HttpVerb] [Nome]Controller', () => {
  let app: INestApplication
  let useCase: [Nome]UseCase

  beforeEach(async () => {
    const { testingModule, mockUseCase } = await create[Nome]ControllerTestSetup()
    useCase = mockUseCase
    app = testingModule.createNestApplication()
    await app.init()
  })

  it('should return [expected] when valid request', async () => {
    // Arrange
    const validData = create[Nome]TestData()
    jest.spyOn(useCase, 'execute').mockResolvedValue(expectedResponse)

    // Act & Assert
    await request(app.getHttpServer())
      .[httpVerb]('/[route]')
      .send(validData)
      .expect(expectedStatus)
  })

  it('should return 400 when invalid data', async () => {
    // Testes de validação
  })

  it('should handle use-case errors appropriately', async () => {
    // Testes de erro
  })
})
Comandos de Execução
#### Build do Projeto (IMPORTANTE):
```bash
# Após criar/modificar controller, execute build em background
docker exec ead-backend-dev pnpm run build

Testar Controller:
bashdocker exec -it ead-backend-dev sh -c "pnpm test src/infra/controllers/tests/[controller-name]/[verb]-[nome].controller.spec.ts"
Se modificou dev-setup:
bashdocker exec ead-backend-dev pnpm seed:dev
Reiniciar sistema:
bashdocker compose down && docker compose up -d
Perguntas Antes de Começar

Qual verbo HTTP (GET, POST, PUT, DELETE)?
Qual a rota/endpoint específico?
Quais campos no request body (se aplicável)?
Quais validações são necessárias?
Qual status HTTP de sucesso esperado?
Precisa de autenticação/autorização?
Há query parameters ou path parameters?

Aguarde respostas sobre os requisitos específicos antes de implementar.

## 📖 DOCUMENTAÇÃO SWAGGER - GUIA COMPLETO

### 🎨 Estrutura de Documentação por Camadas

#### 1. Nível Global (main.ts)
```typescript
const config = new DocumentBuilder()
  .setTitle('Revalida Italia API')
  .setDescription(`Descrição completa com:
    - Overview do sistema
    - Fluxo de autenticação
    - Rate limiting
    - Roles e permissões
  `)
  .setVersion('1.0.0')
  .addBearerAuth()
  .addTag('TagName', 'Tag description')
  .setContact()
  .setLicense()
  .addServer()
  .build();
```

#### 2. Nível de Controller
```typescript
@ApiTags('Domain Name')
@ApiBearerAuth() // se todas as rotas precisam auth
@Controller('route')
export class Controller {
```

#### 3. Nível de Endpoint
```typescript
@ApiOperation({ summary, description })
@ApiBody() / @ApiParam() / @ApiQuery()
@ApiResponse() // múltiplos para cada status
@Public() / @Roles() / @ApiBearerAuth()
@Get() / @Post() / @Put() / @Delete()
```

### 🚀 Quick Reference - Decorators por Verbo

| Verbo | Body | Params | Query | Status Success |
|-------|------|--------|-------|----------------|
| GET (single) | ❌ | ✅ id | ✅ expand | 200 |
| GET (list) | ❌ | ❌ | ✅ page,limit,sort,filter | 200 |
| POST | ✅ | ❌ | ❌ | 201 + Location header |
| PUT | ✅ | ✅ id | ❌ | 200 |
| PATCH | ✅ | ✅ id | ❌ | 200 |
| DELETE | ❌ | ✅ id | ❌ | 204 |

### ⚠️ Erros Comuns e Como Evitar

#### ❌ NÃO FAÇA:
```typescript
// Expor detalhes de segurança
@ApiResponse({ 
  status: 401, 
  description: 'User not found in database' 
})

// Exemplos genéricos
@ApiProperty({ example: 'string' })

// Documentação vaga
@ApiOperation({ summary: 'Updates resource' })

// Esquecer autenticação
@Post('admin-only-route')
// Faltou @ApiBearerAuth() e @Roles('admin')
```

#### ✅ FAÇA:
```typescript
// Mensagem genérica para segurança
@ApiResponse({ 
  status: 401, 
  description: 'Authentication failed' 
})

// Exemplos realistas
@ApiProperty({ 
  example: 'mario.rossi@medicina.it',
  description: 'Email do estudante'
})

// Documentação detalhada
@ApiOperation({ 
  summary: 'Update course status',
  description: `Changes course status with validation...`
})

// Sempre documentar auth
@ApiBearerAuth()
@Roles('admin')
@Post('admin-only-route')
```

### 📝 Template de Documentação Completa

```typescript
import { 
  Controller, Get, Post, Put, Delete, 
  Body, Param, Query, UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, ApiOperation, ApiResponse, ApiBody, 
  ApiParam, ApiQuery, ApiBearerAuth, ApiHeader 
} from '@nestjs/swagger';

@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
  
  @ApiOperation({ 
    summary: 'Create new resource',
    description: `
      Creates a new resource with validation.
      
      ## Business Rules
      - Rule 1 explanation
      - Rule 2 explanation
      
      ## Access Control
      - Who can access
      - Special permissions
      
      ## Side Effects
      - What happens after
      - Related updates
      
      ## Next Steps
      - GET /resources/{id}
      - PUT /resources/{id}
    `
  })
  @ApiBody({ 
    type: CreateResourceDto,
    description: 'Resource data',
    examples: {
      complete: {
        summary: 'All fields',
        value: { /* realistic data */ }
      },
      minimal: {
        summary: 'Required only',
        value: { /* minimal data */ }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Created successfully',
    type: ResourceResponseDto,
    headers: {
      Location: {
        description: 'URL of created resource',
        schema: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error',
    type: ValidationErrorDto,
    examples: {
      missingField: {
        summary: 'Required field missing',
        value: { /* error example */ }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Authentication required',
    type: UnauthorizedErrorDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient permissions',
    type: ForbiddenErrorDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Resource already exists',
    type: ConflictErrorDto
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateResourceDto) {
    // Implementation
  }
}
```

### 🔍 Checklist Final de Revisão

Antes de considerar a documentação completa, verifique:

#### Documentação Técnica
- [ ] Todos os parâmetros têm @ApiProperty com example e description
- [ ] Todos os status codes possíveis estão documentados
- [ ] DTOs de request E response estão criados
- [ ] Exemplos são realistas (não "test123")
- [ ] Headers especiais documentados (se houver)
- [ ] Rate limiting mencionado (se aplicável)

#### Contexto de Negócio
- [ ] Explica O QUE o endpoint faz
- [ ] Explica QUEM pode acessar
- [ ] Explica QUANDO usar
- [ ] Lista regras de negócio
- [ ] Indica próximos passos
- [ ] Menciona efeitos colaterais

#### Segurança
- [ ] @ApiBearerAuth() em rotas autenticadas
- [ ] @Public() em rotas públicas
- [ ] @Roles() quando necessário
- [ ] Mensagens de erro não expõem detalhes sensíveis
- [ ] Validações documentadas sem expor regras de segurança

#### Developer Experience
- [ ] Summary claro e direto
- [ ] Description com markdown formatado
- [ ] Exemplos cobrem casos comuns
- [ ] Links para endpoints relacionados
- [ ] Troubleshooting de erros comuns

### 💡 Dicas de Produtividade

1. **Crie snippets** para os padrões mais comuns
2. **Copie de endpoints similares** já bem documentados
3. **Use o Swagger UI** para testar enquanto desenvolve
4. **Documente DURANTE** o desenvolvimento, não depois
5. **Peça revisão** de outro dev na documentação

### 🎯 Objetivo Final

A documentação deve permitir que um desenvolvedor:
- Entenda o endpoint em < 30 segundos
- Consiga fazer a primeira chamada em < 2 minutos
- Saiba lidar com erros sem perguntar
- Entenda o contexto de negócio
- Saiba os próximos passos

Se sua documentação atinge esses objetivos, está no padrão esperado!
````
