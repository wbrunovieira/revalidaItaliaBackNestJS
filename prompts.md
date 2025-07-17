# Prompts Específicos para Desenvolvimento

Este documento define prompts específicos e padronizados para interações com a IA em cada etapa do desenvolvimento, garantindo consistência e eficiência.

---

## 1. Criar Entidade

### Prompt:

"Leia o arquivo `project-reference-guide.md` e crie uma nova entidade DDD seguindo os padrões do projeto. Utilize os exemplos fornecidos como referência, seguindo estrutura, métodos e validações. Pergunte caso haja dúvidas sobre as regras de negócio. Importante: sempre refatore completamente o arquivo ao atualizá-lo."

### Arquivos de Referência:

- `src/domain/<domínio>/enterprise/entities/*.entity.ts`
- `prisma/schema.prisma`

---

Antes de começar, sempre confirme:

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.

## 2. Criar Interface e Repositórios (Prisma e In-Memory)

### Prompt:

"Leia o arquivo `project-reference-guide.md` e crie a interface do repositório, a implementação Prisma e a implementação In-Memory, seguindo o padrão existente no projeto. Confirme antes se há métodos específicos que precisam ser incluídos ou excluídos. Importante: sempre refatore completamente os arquivos ao atualizá-los."

### Arquivos de Referência:

- `src/domain/<domínio>/application/repositories/i-*.repository.ts`
- `src/infra/database/prisma/repositories/prisma-*.repository.ts`
- `src/test/repositories/in-memory-*.repository.ts`

Antes de começar, sempre confirme:

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.

---

## 3. Criar Use-Case (DTOs, Schema e Teste Unitário)

### Prompt:

"Leia o arquivo `project-reference-guide.md` e crie um novo Use-Case, incluindo DTOs necessários, schema de validação Zod, e testes unitários abrangendo casos de erro, edge cases e inputs inválidos. Antes de iniciar, valide se todos os métodos necessários existem nos repositórios, e caso necessário, sugira métodos adicionais.

**Após a criação:**

1. **Registrar no Module:** Adicione o Use-Case no module correspondente seguindo o padrão do projeto
2. **Executar teste:** Execute o teste com o comando `docker exec -it ead-backend-dev sh -c "pnpm test src/path/to/use-case.spec.ts"`

**🚨 PRINCÍPIO CRÍTICO DE TESTES UNITÁRIOS USE-CASE:**
Quando testes unitários do use-case falham, **SEMPRE** corrija o sistema/implementação para fazer os testes passarem, **NUNCA** ajuste os testes para corresponder ao comportamento incorreto. Os testes unitários representam as regras de negócio esperadas.

**Localização das correções conforme responsabilidades DDD:**
- **Falha na validação de entrada:** Corrigir schema Zod em `use-cases/validations/`
- **Falha na lógica de negócio:** Corrigir o use-case em `application/use-cases/`
- **Falha nas regras de domínio:** Corrigir entidades em `enterprise/entities/`
- **Falha na integração:** Corrigir repositórios em `infra/database/prisma/repositories/`

Importante: sempre refatore completamente os arquivos ao atualizá-los."

### Arquivos de Referência:

- `src/domain/<domínio>/application/use-cases/*.use-case.ts`
- `src/domain/<domínio>/application/dtos/*.dto.ts`
- `src/domain/<domínio>/application/use-cases/validations/*.schema.ts`
- `src/domain/<domínio>/application/use-cases/*.use-case.spec.ts`
- `src/domain/<domínio>/application/repositories/i-*.repository.ts`
- `src/infra/database/prisma/repositories/prisma-*.repository.ts`
- `src/test/repositories/in-memory-*.repository.ts`

Antes de começar, sempre confirme:

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.

---

## 4. Criar Controller e Teste Unitário da Rota

### Prompt:

"Leia o arquivo `project-reference-guide.md` e crie ou atualize o Controller e a rota associada ao Use-Case especificado. Inclua as validações usando class-validator e crie os testes unitários para a rota.

**Verificações obrigatórias:**
a) **Module:** Verifique se existe o module do controller. Se não existir, crie seguindo o padrão:

```typescript
@Module({
  controllers: [ControllerName],
  providers: [
    UseCaseName,
    {
      provide: 'RepositoryInterface',
      useClass: PrismaRepositoryImplementation,
    },
  ],
})
export class ModuleName {}
```

b) **Executar teste:** Após criação, execute `docker exec -it ead-backend-dev sh -c "pnpm test src/infra/controllers/tests/controller-name/verb-controller.spec.ts"`

**🚨 PRINCÍPIO CRÍTICO DE TESTES UNITÁRIOS CONTROLLER:**
Quando testes unitários do controller falham, **SEMPRE** corrija o sistema/implementação para fazer os testes passarem, **NUNCA** ajuste os testes para corresponder ao comportamento incorreto. Os testes unitários representam o comportamento esperado da API.

**Localização das correções conforme responsabilidades DDD:**
- **Falha na validação de entrada:** Corrigir DTOs em `controllers/dtos/` (class-validator)
- **Falha no mapeamento de dados:** Corrigir o controller em `controllers/`
- **Falha no tratamento de erros:** Corrigir exception filters em `filters/`
- **Falha na integração com use-case:** Corrigir chamadas no controller
- **Falha na resposta HTTP:** Corrigir status codes e estrutura de resposta

c) **Request file:** Verifique se existe arquivo em `requests/controller-name.http` e adicione a rota de forma simples, seguindo o padrão existente

d) **Dev setup:** Adicione a rota em `requests/dev-setup/` se necessário, refatorando o script para incluir a nova funcionalidade. Se modificar o dev-setup, execute o seed: `docker exec ead-backend-dev pnpm seed:dev`

e) **Testar sistema:** Após todas as alterações, reinicie o sistema Docker para verificar se tudo está funcionando:

**Estrutura de testes:** Se ainda não existir, crie o diretório `shared/` dentro de `src/infra/controllers/tests/<controller-name>/` contendo:

- `*-controller-test-setup.ts` (configuração de mocks e instâncias)
- `*-controller-test-helpers.ts` (métodos auxiliares para testes)
- `*-controller-test-data.ts` (dados de teste organizados)

Crie um arquivo específico para cada verbo HTTP (ex: `get-*.controller.spec.ts`, `post-*.controller.spec.ts`, `put-*.controller.spec.ts`, `delete-*.controller.spec.ts`) seguindo o padrão estabelecido no projeto.

Importante: sempre refatore completamente os arquivos ao atualizá-los."

### Arquivos de Referência:

- `src/infra/controllers/*.controller.ts`
- `src/infra/controllers/tests/<controller-name>/shared/*.ts`
- `src/infra/controllers/tests/<controller-name>/<verb>-*.controller.spec.ts`

Antes de começar, sempre confirme:

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.

---

## 5. Criar Teste E2E

### Prompt:

"Leia o arquivo `project-reference-guide.md` e crie um teste E2E completo usando Vitest e Supertest para a nova rota criada. Garanta que cubra o fluxo feliz, cenários de erro e validações detalhadas.

**Estrutura de testes E2E:** Se ainda não existir, crie o diretório `<controller-name>/` dentro de `test/e2e/` contendo:

- `shared/` com arquivos auxiliares para setup, helpers e dados de teste
- Um arquivo específico para cada verbo HTTP (ex: `get-*.e2e.spec.ts`, `post-*.e2e.spec.ts`, `put-*.e2e.spec.ts`, `delete-*.e2e.spec.ts`)

**Configuração JWT obrigatória:** Todos os testes E2E devem usar o módulo de teste E2E que mocka a autenticação JWT:

```typescript
import { E2ETestModule } from '../test-helpers/e2e-test-module';

// No beforeAll:
const { app: testApp } = await E2ETestModule.create([AppModule]);
app = testApp;

// Gerar token fake para testes:
const adminToken = 'test-jwt-token';

// Em todas as requisições, adicionar o header:
await request(app.getHttpServer())
  .post('/endpoint')
  .set('Authorization', `Bearer ${adminToken}`)
  .send(payload);
```

**Importante:** Mesmo que a rota ainda não tenha autenticação implementada, adicione o header JWT em todos os testes. Isso garante que quando a autenticação for implementada, os testes já estarão preparados.

**Tarefa final:** Executar o teste com o comando `docker exec -it ead-backend-dev sh -c "pnpm test:e2e test/e2e/controller-name/verb-endpoint.e2e.spec.ts"`

**🚨 PRINCÍPIO CRÍTICO DE TESTES E2E:**
Quando testes E2E falham, **SEMPRE** corrija o sistema/implementação para fazer os testes passarem, **NUNCA** ajuste os testes para corresponder ao comportamento incorreto. Os testes E2E representam a verdadeira especificação do sistema e devem ser a fonte de verdade.

### **Configurações Técnicas Críticas para Testes E2E:**

**1. Configuração JWT Mock (e2e-test-module.ts):**
```typescript
// JwtService deve usar base64url encoding para tokens válidos
.overrideProvider(JwtService)
.useValue({
  sign: (payload: any) => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${payloadEncoded}.fake-signature`;
  },
  verify: (token: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  },
})
```

**2. Guards Mock - JwtAuthGuard:**
```typescript
// Deve lançar UnauthorizedException (401) para tokens inválidos/ausentes
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw new UnauthorizedException('Unauthorized');
}

// Tokens especiais para diferentes roles:
if (token === 'test-jwt-token') {
  request.user = { sub: 'test-admin-user-id', role: 'admin' };
} else if (token === 'test-jwt-student-token') {
  request.user = { sub: 'test-student-user-id', role: 'student' };
}
```

**3. Guards Mock - RolesGuard:**
```typescript
// Verificar endpoints admin-only baseado em URL patterns
const adminOnlyEndpoints = [
  'GET /students',
  'GET /students/search', 
  'DELETE /students/',
];
const isAdminOnly = adminOnlyEndpoints.some(endpoint => {
  if (endpoint.endsWith('/')) {
    return currentEndpoint.startsWith(endpoint);
  }
  return currentEndpoint === endpoint;
});
```

**4. Validação de Paginação:**
```typescript
// DTOs NÃO devem ter @Min(1) em campos page/pageSize
@IsOptional()
@Type(() => Number)
@IsInt()
page?: number; // Sem @Min(1)

@IsOptional() 
@Type(() => Number)
@IsInt()
@Max(100)
pageSize?: number; // Sem @Min(1)

// Use cases devem tratar valores inválidos graciosamente:
const page = request.page && request.page > 0 ? Math.floor(request.page) : 1;
const pageSize = request.pageSize && request.pageSize > 0 ? Math.floor(request.pageSize) : 20;
```

**5. Tokens Padrão para Testes:**
- `'test-jwt-token'` → Usuário admin (acesso total)
- `'test-jwt-student-token'` → Usuário student (acesso limitado)
- `'invalid-token'` → Token inválido (deve retornar 401)

**6. Performance Tests:**
- Sempre incluir tokens JWT em todas as chamadas de API
- Usar tokens apropriados para o tipo de usuário sendo testado
- Considerar conflitos em testes concorrentes (usuário não pode ter múltiplas tentativas ativas)

**Localização das correções conforme responsabilidades DDD:**
- **Falha na validação de entrada:** Corrigir DTOs (`controllers/dtos/`) e schemas Zod (`use-cases/validations/`)
- **Falha no processamento de dados:** Corrigir use-cases em `application/use-cases/`
- **Falha nas regras de negócio:** Corrigir entidades em `enterprise/entities/`
- **Falha na persistência:** Corrigir repositórios em `infra/database/prisma/repositories/`
- **Falha na resposta HTTP:** Corrigir controllers em `controllers/` e filtros em `filters/`
- **Falha na integração entre camadas:** Verificar injeção de dependências em modules
- **Falha na configuração:** Corrigir setup de testes, configurações de banco, ValidationPipes

**Ordem de investigação DDD:**
1. **Infrastructure → Application:** Verificar se dados chegam corretamente ao use-case
2. **Application → Domain:** Verificar se regras de negócio estão sendo aplicadas
3. **Domain → Infrastructure:** Verificar se dados são persistidos corretamente
4. **End-to-End:** Verificar se resposta HTTP está no formato esperado

Antes de iniciar, confirme os cenários obrigatórios a serem testados. Importante: sempre refatore completamente o arquivo ao atualizá-lo."

### Arquivos de Referência:

- `test/e2e/<controller-name>/<verb>-*.e2e.spec.ts`
- `test/e2e/<controller-name>/shared/*.ts`promp
- `test/e2e/shared/*.ts` (utilitários globais)

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.

---

## 🚨 PRINCÍPIO CRÍTICO UNIVERSAL - TESTES COMO ESPECIFICAÇÃO

**REGRA FUNDAMENTAL:** Em TODOS os tipos de testes (unitários, integração, E2E), quando um teste falha, **SEMPRE** corrija o sistema/implementação para fazer o teste passar, **NUNCA** ajuste o teste para corresponder ao comportamento incorreto.

### Hierarquia de Responsabilidades DDD:

**1. Domain Layer (Regras de Negócio):**
- `enterprise/entities/` - Regras de domínio, validações, transformações
- `enterprise/value-objects/` - Objetos de valor imutáveis

**2. Application Layer (Casos de Uso):**
- `application/use-cases/` - Orquestração de regras de negócio
- `application/use-cases/validations/` - Validação de entrada (Zod)
- `application/dtos/` - Contratos de entrada/saída
- `application/repositories/` - Interfaces de persistência

**3. Infrastructure Layer (Detalhes Técnicos):**
- `controllers/` - Entrada HTTP, mapeamento de dados
- `controllers/dtos/` - Validação HTTP (class-validator)
- `filters/` - Tratamento de exceções HTTP
- `database/prisma/repositories/` - Implementação de persistência

### Fluxo de Correção:
1. **Identifique a camada responsável** pela funcionalidade que está falhando
2. **Corrija a implementação** na camada apropriada
3. **Mantenha a consistência** entre todas as camadas
4. **Valide** que a correção não quebra outros testes

---

## Checklist para todos os Prompts:

Antes de começar, sempre confirme:

- Exemplos e contexto já fornecidos.
- Dúvidas sobre regras específicas de negócio.
- Escopo detalhado e métodos necessários.
