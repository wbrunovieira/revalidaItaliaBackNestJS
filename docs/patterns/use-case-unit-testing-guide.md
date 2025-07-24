# Use Case Unit Testing Guide

## Overview

This guide establishes the testing patterns and best practices for unit testing use cases in our Domain-Driven Design (DDD) architecture. It covers comprehensive testing strategies, including success scenarios, error handling, edge cases, security considerations, and performance testing.

## Core Testing Principles

### 1. **Test Behavior, Not Implementation**
Tests should focus on the expected behavior and outcomes rather than implementation details. This ensures tests remain valid even when internal implementations change.

### 2. **Fix the System, Never the Tests**
When tests fail, **ALWAYS** fix the system implementation to make the tests pass, **NEVER** adjust the tests to match incorrect system behavior. Tests are specifications that must be respected.

### 3. **Follow DDD Principles**
- Business rules belong in entities and value objects
- Use cases orchestrate domain operations
- Test domain invariants at the appropriate level

## Test Structure

### Basic Test Suite Organization

```typescript
describe('CreateUserUseCase', () => {
  // Setup
  let identityRepo: InMemoryUserIdentityRepository;
  let profileRepo: InMemoryUserProfileRepository;
  let authorizationRepo: InMemoryUserAuthorizationRepository;
  let unitOfWork: InMemoryAuthUnitOfWork;
  let eventDispatcher: IEventDispatcher;
  let sut: CreateUserUseCase; // System Under Test

  beforeEach(() => {
    // Initialize all dependencies with in-memory implementations
    identityRepo = new InMemoryUserIdentityRepository();
    profileRepo = new InMemoryUserProfileRepository();
    authorizationRepo = new InMemoryUserAuthorizationRepository();
    unitOfWork = new InMemoryAuthUnitOfWork(
      identityRepo,
      profileRepo,
      authorizationRepo,
    );
    eventDispatcher = {
      dispatch: vi.fn(),
    };
    sut = new CreateUserUseCase(
      identityRepo,
      profileRepo,
      authorizationRepo,
      unitOfWork,
      eventDispatcher,
    );
  });

  // Test categories
  describe('Success scenarios', () => {});
  describe('Error scenarios', () => {});
  describe('Domain invariants validation', () => {});
  describe('Invalid input scenarios', () => {});
  describe('Edge cases', () => {});
  describe('Transaction and atomicity scenarios', () => {});
  describe('Event sourcing scenarios', () => {});
  describe('Concurrency scenarios', () => {});
  describe('Security scenarios', () => {});
  describe('Business rules tests', () => {});
  describe('Additional edge cases', () => {});
});
```

## Comprehensive Test Categories

### 1. Success Scenarios
Test the happy path with valid inputs:
- Minimal required fields
- All optional fields populated
- Different valid combinations

```typescript
it('should create user with minimum required fields', async () => {
  const request = {
    email: 'jane.doe@example.com',
    password: 'ValidPass123',
    fullName: 'Jane Doe',
    nationalId: '98765432101',
  };

  const result = await sut.execute(request);

  expect(result.isRight()).toBe(true);
  if (result.isRight()) {
    expect(result.value.email).toBe('jane.doe@example.com');
    expect(result.value.fullName).toBe('Jane Doe');
    expect(result.value.role).toBe('student'); // default role
  }
});
```

### 2. Error Scenarios
Test all possible error conditions:
- Duplicate constraints (email, nationalId)
- Repository failures
- External service failures
- Validation errors

```typescript
it('should return DuplicateEmailError when email already exists', async () => {
  // Create existing user
  const existingIdentity = UserIdentity.create({
    email: Email.create('existing@example.com'),
    password: await Password.createFromPlain('ExistingPass123').toHash(),
    emailVerified: false,
  });
  await identityRepo.save(existingIdentity);

  const request = {
    email: 'existing@example.com',
    password: 'NewPass123',
    fullName: 'New User',
    nationalId: '22222222222',
  };

  const result = await sut.execute(request);

  expect(result.isLeft()).toBe(true);
  if (result.isLeft()) {
    expect(result.value.message).toContain('Email already registered');
  }
});
```

### 3. Domain Invariants Validation
Test business rules enforced by entities and value objects:
- Required field validation
- Field length constraints
- Format validation
- Business rule violations

```typescript
it('should reject empty fullName', async () => {
  const request = {
    email: 'test@example.com',
    password: 'SecurePass123',
    fullName: '',
    nationalId: '12345678901',
  };

  const result = await sut.execute(request);

  expect(result.isLeft()).toBe(true);
  if (result.isLeft()) {
    expect(result.value.message).toContain('Full name cannot be empty');
  }
});
```

### 4. Edge Cases

#### Email Boundary Cases
```typescript
it('should handle email with exactly 64 characters in local part', async () => {
  const localPart = 'a'.repeat(64);
  const request = {
    email: `${localPart}@example.com`,
    password: 'SecurePass123',
    fullName: 'Max Local Part User',
    nationalId: '91111111111',
  };

  const result = await sut.execute(request);
  expect(result.isRight()).toBe(true);
});
```

#### Unicode and Special Characters
```typescript
it('should handle unicode and special characters', async () => {
  const request = {
    email: 'user@example.com',
    password: 'Secure123',
    fullName: '李明 García-O\'Connor', // Mixed scripts
    nationalId: '82222222222',
    bio: 'Multi-line\nbio with\ttabs and émojis 🎉',
    profession: 'Développeur / デベロッパー',
  };

  const result = await sut.execute(request);
  expect(result.isRight()).toBe(true);
});
```

#### Type Coercion
```typescript
it('should reject array for string fields', async () => {
  const request = {
    email: 'array@example.com',
    password: 'SecurePass123',
    fullName: ['Array', 'Name'] as any,
    nationalId: '93333333332',
  };

  const result = await sut.execute(request);
  expect(result.isLeft()).toBe(true);
});
```

### 5. Transaction and Atomicity Tests
Ensure data consistency with Unit of Work pattern:

```typescript
it('should maintain consistency when multiple saves fail', async () => {
  // Mock identity repository to fail within unit of work
  vi.spyOn(unitOfWork.identityRepository, 'save').mockResolvedValueOnce(
    left(new Error('Identity save failed')),
  );

  const request = {
    email: 'atomic@example.com',
    password: 'SecurePass123',
    fullName: 'Atomic User',
    nationalId: '88888888881',
  };

  const result = await sut.execute(request);

  expect(result.isLeft()).toBe(true);
  
  // No data should be persisted due to rollback
  expect(identityRepo.items).toHaveLength(0);
  expect(profileRepo.items).toHaveLength(0);
  expect(authorizationRepo.items).toHaveLength(0);
});
```

### 6. Event Sourcing Tests
Verify event dispatch and handling:

```typescript
it('should dispatch UserCreatedEvent with correct data', async () => {
  const request = {
    email: 'event@example.com',
    password: 'SecurePass123',
    fullName: 'Event User',
    nationalId: '99999999991',
    role: 'admin' as const,
  };

  const result = await sut.execute(request);

  expect(result.isRight()).toBe(true);
  expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);
  
  const dispatchedEvent = vi.mocked(eventDispatcher.dispatch).mock.calls[0][0];
  expect(dispatchedEvent).toMatchObject({
    email: 'event@example.com',
    fullName: 'Event User',
    role: 'admin',
    source: 'registration',
  });
});
```

### 7. Concurrency Tests
Test race conditions and concurrent operations:

```typescript
it('should handle race condition when two users try to register same email simultaneously', async () => {
  const email = 'race@example.com';
  const request1 = {
    email,
    password: 'SecurePass123',
    fullName: 'User One',
    nationalId: '11111111111',
  };

  const request2 = {
    email,
    password: 'SecurePass123',
    fullName: 'User Two',
    nationalId: '22222222222',
  };

  // Execute both requests in parallel
  const results = await Promise.all([
    sut.execute(request1),
    sut.execute(request2),
  ]);

  // One should succeed, one should fail
  const successes = results.filter(r => r.isRight()).length;
  const failures = results.filter(r => r.isLeft()).length;

  expect(successes).toBe(1);
  expect(failures).toBe(1);
});
```

### 8. Security Tests
Test against common security vulnerabilities:

```typescript
describe('Security scenarios', () => {
  it('should handle SQL injection attempts in email field', async () => {
    const request = {
      email: "admin'--",
      password: 'SecurePass123',
      fullName: 'SQL Test',
      nationalId: '77777777778',
    };

    const result = await sut.execute(request);
    expect(result.isLeft()).toBe(true); // Invalid email format
  });

  it('should not expose password in response', async () => {
    const request = {
      email: 'security@example.com',
      password: 'TestHash123',
      fullName: 'Security Test',
      nationalId: '11111111113',
    };

    const result = await sut.execute(request);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).not.toHaveProperty('password');
      expect(JSON.stringify(result.value)).not.toContain('TestHash123');
    }
  });

  it('should prevent timing attacks on email validation', async () => {
    // Test timing consistency between existing and non-existing emails
    const existingEmail = 'existing@example.com';
    const nonExistingEmail = 'nonexisting@example.com';
    
    // Create existing user
    await createExistingUser(existingEmail);

    // Measure time for existing email
    const startExisting = Date.now();
    await sut.execute({
      email: existingEmail,
      password: 'SecurePass123',
      fullName: 'Test User',
      nationalId: '12345678901',
    });
    const timeExisting = Date.now() - startExisting;

    // Measure time for non-existing email
    const startNonExisting = Date.now();
    await sut.execute({
      email: nonExistingEmail,
      password: 'SecurePass123',
      fullName: 'Test User',
      nationalId: '12345678902',
    });
    const timeNonExisting = Date.now() - startNonExisting;

    // Times should be similar (within reasonable variance)
    const timeDifference = Math.abs(timeExisting - timeNonExisting);
    expect(timeDifference).toBeLessThan(100); // 100ms tolerance
  });
});
```

### 9. Business Rules Tests
Test domain-specific business logic:

```typescript
describe('Business rules tests', () => {
  it('should calculate age correctly when birthDate is provided', async () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25); // Exactly 25 years ago

    const request = {
      email: 'age25@example.com',
      password: 'SecurePass123',
      fullName: 'Age Test User',
      nationalId: '43333333333',
      birthDate,
    };

    const result = await sut.execute(request);
    expect(result.isRight()).toBe(true);
    
    const profile = profileRepo.items.find(p => p.nationalId.value === '43333333333');
    expect(profile?.age).toBe(25);
  });

  it('should handle different role types', async () => {
    const roles = ['student', 'tutor', 'admin'] as const;
    
    for (const [index, role] of roles.entries()) {
      const request = {
        email: `${role}@example.com`,
        password: 'SecurePass123',
        fullName: `${role} User`,
        nationalId: `2000000000${index}`,
        role,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.role).toBe(role);
      }
    }
  });
});
```

## Coverage Analysis Checklist

After implementing tests, verify coverage across these dimensions:

### 1. **Input Validation Coverage**
- [ ] All required fields tested with null, undefined, empty values
- [ ] String fields tested with whitespace, special characters, Unicode
- [ ] Numeric fields tested with boundaries, negative values, overflow
- [ ] Date fields tested with past, future, invalid dates
- [ ] Boolean fields tested with truthy/falsy values
- [ ] Arrays/Objects tested where primitives expected

### 2. **Business Logic Coverage**
- [ ] All business rules have positive and negative tests
- [ ] Domain invariants are validated
- [ ] Entity state transitions are tested
- [ ] Value object validations are comprehensive
- [ ] Cross-field validations are covered

### 3. **Error Handling Coverage**
- [ ] All error types are tested
- [ ] Error messages are meaningful and tested
- [ ] Partial failure scenarios are covered
- [ ] Rollback mechanisms are tested
- [ ] Recovery scenarios are validated

### 4. **Security Coverage**
- [ ] SQL injection attempts
- [ ] XSS prevention
- [ ] Command injection
- [ ] Path traversal
- [ ] Timing attack prevention
- [ ] Password exposure prevention
- [ ] Data sanitization

### 5. **Performance Coverage**
- [ ] Large payload handling
- [ ] Concurrent operation handling
- [ ] Resource exhaustion scenarios
- [ ] Memory leak prevention
- [ ] Timeout handling

### 6. **Integration Coverage**
- [ ] Repository interactions
- [ ] Event dispatching
- [ ] Transaction management
- [ ] External service calls
- [ ] Unit of Work pattern

## Best Practices

### 1. **Use In-Memory Implementations**
Always use in-memory repository implementations for unit tests to ensure fast, isolated tests.

### 2. **Test Data Builders**
Create test data builders for complex objects:

```typescript
class UserRequestBuilder {
  private request = {
    email: 'test@example.com',
    password: 'SecurePass123',
    fullName: 'Test User',
    nationalId: '12345678901',
  };

  withEmail(email: string): this {
    this.request.email = email;
    return this;
  }

  withRole(role: UserRole): this {
    this.request.role = role;
    return this;
  }

  build(): CreateUserRequest {
    return { ...this.request };
  }
}
```

### 3. **Descriptive Test Names**
Use clear, descriptive test names that explain the scenario and expected outcome:
- ✅ `should return DuplicateEmailError when email already exists`
- ❌ `test email duplicate`

### 4. **Arrange-Act-Assert Pattern**
Structure tests clearly:

```typescript
it('should create user successfully', async () => {
  // Arrange
  const request = new UserRequestBuilder()
    .withEmail('new@example.com')
    .build();

  // Act
  const result = await sut.execute(request);

  // Assert
  expect(result.isRight()).toBe(true);
  expect(identityRepo.items).toHaveLength(1);
});
```

### 5. **Test Isolation**
Each test should be independent and not rely on the state from other tests.

### 6. **Mock External Dependencies**
Mock only external dependencies (APIs, databases), not domain objects.

### 7. **Verify Side Effects**
Always verify that the expected side effects occurred:
- Data persisted correctly
- Events dispatched
- Transactions committed/rolled back

## Common Pitfalls to Avoid

1. **Testing Implementation Details**: Focus on behavior, not how it's implemented
2. **Incomplete Error Testing**: Test all error paths, not just the happy path
3. **Ignoring Edge Cases**: Always test boundaries and extreme values
4. **Missing Concurrency Tests**: Real systems have concurrent users
5. **Weak Security Testing**: Always include security scenarios
6. **Not Testing Rollbacks**: Transaction failures should leave no partial state

## Continuous Improvement

1. **Review Failed Tests**: When tests fail, examine if the test revealed a real bug
2. **Add Regression Tests**: When bugs are found, add tests to prevent regression
3. **Refactor Tests**: Keep tests clean and maintainable
4. **Update Documentation**: Keep this guide updated with new patterns discovered

## Conclusion

Comprehensive unit testing of use cases is crucial for maintaining a robust, reliable system. By following these patterns and ensuring complete coverage across all dimensions, we create a safety net that allows confident refactoring and feature development while maintaining system integrity.

Remember: **Tests are the specification. When tests fail, fix the implementation, not the tests.**