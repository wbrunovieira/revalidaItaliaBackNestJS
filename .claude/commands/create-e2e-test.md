---
description: Cria teste E2E completo com Vitest, Supertest e configuração JWT
allowed-tools: FileEditor, Bash(cat:*), Bash(grep:*), Bash(find:*), Bash(docker exec:*)
argument-hint: [nome-controller] [GET|POST|PUT|DELETE]
---

# Criar Teste E2E Completo

## Contexto

Siga os padrões de desenvolvimento já carregados via `/exec-prompt` e analise a estrutura de testes E2E existente.

### Arquivos de Referência para Análise:

- Testes E2E: !`find test/e2e -name "*.e2e.spec.ts" | head -5`
- Test Module: @test/e2e/test-helpers/e2e-test-module.ts
- Helpers globais: !`find test/e2e/shared -name "*.ts" | head -5`

## Sua Tarefa

Crie teste E2E completo para **$ARGUMENTS** incluindo:

### 1. Estrutura de Diretórios

test/e2e/[controller-name]/
├── shared/
│ ├── [nome]-e2e-test-setup.ts
│ ├── [nome]-e2e-test-helpers.ts
│ └── [nome]-e2e-test-data.ts
└── [verb]-[endpoint].e2e.spec.ts

### 2. Configuração Obrigatória JWT

**SEMPRE use E2ETestModule com JWT mockado:**

```typescript
import { E2ETestModule } from '../test-helpers/e2e-test-module';

beforeAll(async () => {
  const { app: testApp } = await E2ETestModule.create([AppModule]);
  app = testApp;
});

// Tokens padrão:
const adminToken = 'test-jwt-token';        // Admin access
const studentToken = 'test-jwt-student-token'; // Student access
const invalidToken = 'invalid-token';       // Para testar 401
3. Headers JWT em TODAS as Requisições
typescriptawait request(app.getHttpServer())
  .post('/endpoint')
  .set('Authorization', `Bearer ${adminToken}`) // OBRIGATÓRIO
  .send(payload)
  .expect(201);
🚨 PRINCÍPIO CRÍTICO DE TESTES E2E
Testes E2E são a especificação do sistema. Quando falharem, corrija:
Ordem de Investigação DDD:

Infrastructure → Application: Dados chegam ao use-case?
Application → Domain: Regras de negócio aplicadas?
Domain → Infrastructure: Dados persistidos?
End-to-End: Resposta HTTP correta?

Localização das Correções:

Validação de entrada → DTOs + Schemas Zod
Processamento → Use-cases
Regras de negócio → Entidades
Persistência → Repositórios
Resposta HTTP → Controllers + Filters
Integração → Modules (DI)

Estrutura do Teste E2E
typescriptdescribe('[VERB] /[endpoint] - E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Success cases', () => {
    it('should [action] when admin user', async () => {
      // Arrange
      const payload = createValid[Entity]Data();

      // Act & Assert
      const response = await request(app.getHttpServer())
        .[verb]('/[endpoint]')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(expectedStatus);

      // Validate response structure
      expect(response.body).toMatchObject({
        // expected structure
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when missing required fields', async () => {
      const invalidPayload = {};

      await request(app.getHttpServer())
        .[verb]('/[endpoint]')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when invalid field format', async () => {
      // Test each validation rule
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .[verb]('/[endpoint]')
        .send(validPayload)
        .expect(401);
    });

    it('should return 401 when invalid token', async () => {
      await request(app.getHttpServer())
        .[verb]('/[endpoint]')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(validPayload)
        .expect(401);
    });

    it('should return 403 when student tries admin endpoint', async () => {
      // Se aplicável
      await request(app.getHttpServer())
        .[verb]('/[endpoint]')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validPayload)
        .expect(403);
    });
  });

  describe('Business rules', () => {
    it('should [validate business rule 1]', async () => {
      // Testes específicos de regras de negócio
    });
  });

  describe('Edge cases', () => {
    it('should handle empty lists gracefully', async () => {
      // Para GET endpoints
    });

    it('should handle pagination edge cases', async () => {
      // page=0, pageSize=0, valores negativos
    });
  });
});
Configurações Técnicas Críticas
1. JWT Mock Configuration:

Use base64url encoding
Estrutura: header.payload.signature
Verify deve decodificar corretamente

2. Guards Configuration:

JwtAuthGuard: Lança UnauthorizedException para tokens inválidos
RolesGuard: Verifica admin-only endpoints

3. Validação de Paginação:
typescript// ❌ ERRADO - Não use @Min(1)
@Min(1)
page?: number;

// ✅ CORRETO - Sem @Min(1)
@IsOptional()
@Type(() => Number)
@IsInt()
page?: number;
4. Performance Considerations:

Evite conflitos em testes concorrentes
Use transações para isolamento
Limpe dados entre testes quando necessário

Checklist de Implementação

 Criar estrutura de diretórios com shared/
 Implementar helpers e data builders
 Criar teste com todos os cenários:

 Sucesso (admin)
 Sucesso (student, se aplicável)
 Validações (400)
 Sem token (401)
 Token inválido (401)
 Sem permissão (403)
 Não encontrado (404)
 Regras de negócio
 Edge cases


 Usar JWT em TODAS as chamadas
 Validar estrutura de resposta
 Executar teste

Executar Teste
bashdocker exec -it ead-backend-dev sh -c "pnpm test:e2e test/e2e/[controller-name]/[verb]-[endpoint].e2e.spec.ts"
Perguntas Antes de Começar

Qual endpoint específico será testado?
Quais roles têm acesso (admin, student, tutor)?
Quais validações de entrada existem?
Quais regras de negócio devem ser testadas?
Há paginação ou filtros?
Quais status HTTP são esperados?
Qual a estrutura esperada da resposta?

Aguarde respostas sobre os requisitos específicos antes de implementar.
```

### 5. UUIDs em Testes:

**SEMPRE use UUIDs válidos nos testes, exceto quando testando validação:**

```typescript
// ✅ CORRETO - UUID válido v4
const validId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const courseId = '550e8400-e29b-41d4-a716-446655440000';

// ❌ EVITAR - IDs inválidos (exceto em testes de validação)
const invalidId = '123';
const invalidId2 = 'not-a-uuid';

// Teste específico para UUID inválido
it('should return 400 when invalid UUID format', async () => {
  await request(app.getHttpServer())
    .get('/courses/invalid-uuid-here')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(400);
});

// Helper para gerar UUIDs válidos
import { randomUUID } from 'crypto';
const testId = randomUUID();
```
