# Domain Exceptions Pattern

## Visão Geral

Este documento descreve o padrão de Domain Exceptions implementado no projeto, que fornece uma hierarquia rica de exceções mantendo compatibilidade com o sistema de mapeamento de erros existente.

## Hierarquia de Exceções

```
DomainException (abstract)
├── BusinessRuleException
│   ├── WeakPasswordException
│   └── InvalidEmailFormatException
├── EntityNotFoundException
│   └── ResourceNotFoundError (compatibilidade)
└── AggregateConflictException
    ├── DuplicateEmailError
    └── DuplicateNationalIdError
```

## Estrutura Base

### DomainException

```typescript
export abstract class DomainException extends Error {
  protected _code: string;
  readonly timestamp: Date;
  readonly context: Record<string, any>;
  readonly aggregateId?: string;

  get code(): string {
    return this._code;
  }
}
```

### Características

1. **Metadata Rica**: Cada exceção carrega código, timestamp, contexto e aggregateId
2. **Compatibilidade**: Mantém o `name` da classe para o sistema de mapeamento
3. **Rastreabilidade**: Stack trace adequado e serialização JSON

## Uso das Exceptions

### 1. Criar aliases para manter compatibilidade

```typescript
// Em duplicate-email.exception.ts
export class DuplicateEmailError extends AggregateConflictException {
  constructor(email: string) {
    super(
      'User',
      'Email already registered',
      { 
        email,
        suggestion: 'Try recovering your password or use a different email'
      }
    );
    this._code = 'USER.EMAIL.DUPLICATE';
  }
}
```

### 2. Use cases podem usar ambos os estilos

```typescript
// Estilo antigo (continua funcionando)
if (emailExists) {
  return left(new DuplicateEmailError());
}

// Estilo novo (com metadata rica)
if (emailExists) {
  return left(new DuplicateEmailError(email));
}
```

### 3. Value Objects com exceptions específicas

```typescript
static createFromPlain(plainPassword: string): Password {
  if (plainPassword.length < MIN_LENGTH) {
    throw WeakPasswordException.tooShort(plainPassword.length, MIN_LENGTH);
  }
  
  if (!/[A-Z]/.test(plainPassword)) {
    throw WeakPasswordException.missingUppercase();
  }
  
  // ...
}
```

### 4. Factory Methods para casos comuns

```typescript
// Entity not found
throw EntityNotFoundException.withId('User', userId);

// Business rule violation
throw BusinessRuleException.invariantViolation(
  'User must have at least one role',
  userId
);

// Aggregate conflict
throw AggregateConflictException.duplicateKey(
  'User',
  'email',
  email,
  userId
);
```

## Integração com Error Mapping

### 1. Mapeamento automático

```typescript
// domain-exceptions.mappings.ts
export const domainExceptionMappings: Record<string, ErrorMapping> = {
  WeakPasswordException: {
    type: 'weak-password',
    title: 'Weak Password',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) => error.message,
  },
  // ...
};
```

### 2. Resposta formatada (RFC 7807)

```json
{
  "type": "https://api.portalrevalida.com/errors/weak-password",
  "title": "Weak Password",
  "status": 422,
  "detail": "Password must contain at least one uppercase letter",
  "instance": "/users",
  "traceId": "abc123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Benefícios para Swagger

### 1. Documentação específica

```typescript
@ApiResponse({
  status: 422,
  description: 'Weak password - does not meet security requirements',
  schema: {
    example: {
      type: 'https://api.portalrevalida.com/errors/weak-password',
      title: 'Weak Password',
      status: 422,
      detail: 'Password must contain at least one uppercase letter',
      instance: '/users',
      traceId: 'abc123',
      timestamp: '2024-01-15T10:00:00Z'
    }
  }
})
```

### 2. Schemas detalhados para cada erro

```typescript
// Futuro: Decorator customizado
@ThrowsDomainErrors([
  DuplicateEmailError,
  WeakPasswordException,
  InvalidEmailFormatException
])
async create(@Body() dto: CreateUserDto) { }
```

## Migração Gradual

### Fase 1: Adicionar novas exceptions
- ✅ Criar hierarquia base
- ✅ Manter compatibilidade com nomes existentes
- ✅ Adicionar ao error mapping

### Fase 2: Enriquecer use cases
- Usar factory methods quando apropriado
- Adicionar contexto às exceptions
- Preservar comportamento existente

### Fase 3: Melhorar documentação
- Schemas específicos no Swagger
- Exemplos de cada tipo de erro
- Guias de troubleshooting

### Fase 4: Observabilidade
- Logging estruturado com metadata
- Métricas por tipo de erro
- Alertas para padrões anômalos

## Exemplo Completo

```typescript
// Use case com novo padrão
export class CreateUserUseCase {
  async execute(request: CreateUserRequest) {
    try {
      // Validação com VO
      const passwordVO = Password.createFromPlain(password);
    } catch (err) {
      // WeakPasswordException já tem toda informação necessária
      return left(err);
    }

    // Verificar duplicação
    const emailExists = await this.userRepository.findByEmail(emailVO);
    if (emailExists.isRight() && emailExists.value) {
      // Nova exception com contexto
      return left(new DuplicateEmailError(email));
    }

    // ...
  }
}
```

## Boas Práticas

1. **Sempre forneça contexto**: Use os parâmetros do construtor para adicionar informações úteis
2. **Use factory methods**: Para casos comuns, crie métodos estáticos descritivos
3. **Mantenha códigos consistentes**: Use padrão `DOMAIN.ENTITY.ERROR`
4. **Não exponha dados sensíveis**: Sanitize informações no contexto
5. **Documente no Swagger**: Cada erro deve ter exemplo na documentação

## Conclusão

O padrão de Domain Exceptions fornece:
- ✅ Metadata rica para debugging
- ✅ Compatibilidade total com sistema existente
- ✅ Melhor documentação automática
- ✅ Type safety e IntelliSense
- ✅ Preparado para observabilidade