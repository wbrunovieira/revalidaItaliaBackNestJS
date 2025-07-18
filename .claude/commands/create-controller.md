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

### 1. Controller com Validações

````typescript
@Controller('[route]')
export class [Nome]Controller {
  constructor(private readonly useCase: [Nome]UseCase) {}

  @[HttpVerb]('[endpoint]')
  async handle(@Body() body: [Nome]Dto): Promise<HttpResponse> {
    // Implementação
  }
}
2. DTO com Class-Validator
typescriptexport class [Nome]Dto {
  @IsString()
  @IsNotEmpty()
  field: string

  // Outras validações
}
3. Module Configuration
typescript@Module({
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
4. Estrutura de Testes
Criar em src/infra/controllers/tests/[controller-name]/:
shared/

[nome]-controller-test-setup.ts - Configuração de mocks
[nome]-controller-test-helpers.ts - Helpers para testes
[nome]-controller-test-data.ts - Dados de teste

Testes por verbo HTTP:

get-[nome].controller.spec.ts
post-[nome].controller.spec.ts
put-[nome].controller.spec.ts
delete-[nome].controller.spec.ts

5. Request File
Criar/atualizar requests/[controller-name].http:
http### Create [Entity]
POST {{BASE_URL}}/[route]
Content-Type: application/json

{
  "field": "value"
}

### Get [Entity]
GET {{BASE_URL}}/[route]/{{id}}
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
````
