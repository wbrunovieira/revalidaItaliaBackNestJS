# Repository Pattern Implementation Guide

## Overview

This guide explains how to implement the Repository pattern in our Clean Architecture/DDD project. The Repository pattern provides an abstraction layer between the domain and data mapping layers, allowing us to switch data sources without affecting business logic.

## Architecture Overview

```
Domain Layer (Pure Business Logic)
    ├── application/repositories/i-repository.ts (Interface)
    └── enterprise/entities/entity.ts (Domain Entity)
              ↓
Infrastructure Layer (External Adapters)
    └── database/prisma/repositories/prisma-repository.ts (Implementation)
```

## Key Principles

1. **Dependency Inversion**: Domain depends on abstractions (interfaces), not concrete implementations
2. **Single Responsibility**: Each repository handles one aggregate root
3. **Technology Agnostic**: Interfaces don't know about Prisma, SQL, or any persistence technology
4. **Error Handling**: All methods return `Either<Error, T>` for explicit error handling
5. **Domain-Centric**: Methods use domain language, not database terminology

## Step-by-Step Implementation

### 1. Define the Repository Interface

Location: `src/domain/{bounded-context}/application/repositories/i-{entity}-repository.ts`

```typescript
// src/domain/auth/application/repositories/i-user-identity-repository.ts
import { Either } from '@/core/either';
import { UserIdentity } from '../../enterprise/entities/user-identity';

export abstract class IUserIdentityRepository {
  // Find methods - return null when not found
  abstract findById(id: string): Promise<Either<Error, UserIdentity | null>>;
  abstract findByEmail(email: string): Promise<Either<Error, UserIdentity | null>>;
  
  // List methods - return empty array when no results
  abstract findMany(
    limit: number,
    offset: number,
  ): Promise<Either<Error, { identities: UserIdentity[]; total: number }>>;
  
  // Persistence methods
  abstract save(identity: UserIdentity): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  
  // Domain-specific queries
  abstract findByEmailVerificationToken(
    token: string
  ): Promise<Either<Error, UserIdentity | null>>;
  
  // Bulk operations when needed
  abstract saveMany(identities: UserIdentity[]): Promise<Either<Error, void>>;
}
```

#### Interface Design Rules:

1. **Use abstract class** instead of TypeScript interface (for NestJS DI)
2. **Return Either<Error, T>** for all methods
3. **Return null** for single entity not found (not an error)
4. **Return empty array** for list queries with no results
5. **Use domain language** (e.g., `findByEmail` not `findByUserEmail`)
6. **Include pagination** for list methods
7. **No Prisma/SQL types** in the interface

### 2. Create the Prisma Implementation

Location: `src/infra/database/prisma/repositories/prisma-{entity}-repository.ts`

```typescript
// src/infra/database/prisma/repositories/prisma-user-identity-repository.ts
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { PrismaService } from '@/prisma/prisma.service';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserIdentityMapper } from '@/domain/auth/application/mappers/user-identity.mapper';

@Injectable()
export class PrismaUserIdentityRepository implements IUserIdentityRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Either<Error, UserIdentity | null>> {
    try {
      const identity = await this.prisma.userIdentity.findUnique({
        where: { id },
      });

      if (!identity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(identity));
    } catch (error) {
      return left(new Error(`Failed to find identity by id: ${error}`));
    }
  }

  async findByEmail(email: string): Promise<Either<Error, UserIdentity | null>> {
    try {
      const identity = await this.prisma.userIdentity.findUnique({
        where: { email },
      });

      if (!identity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(identity));
    } catch (error) {
      return left(new Error(`Failed to find identity by email: ${error}`));
    }
  }

  async findMany(
    limit: number,
    offset: number,
  ): Promise<Either<Error, { identities: UserIdentity[]; total: number }>> {
    try {
      const [identities, total] = await Promise.all([
        this.prisma.userIdentity.findMany({
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.userIdentity.count(),
      ]);

      return right({
        identities: identities.map(UserIdentityMapper.toDomain),
        total,
      });
    } catch (error) {
      return left(new Error(`Failed to find identities: ${error}`));
    }
  }

  async save(identity: UserIdentity): Promise<Either<Error, void>> {
    try {
      const data = UserIdentityMapper.toPersistence(identity);

      await this.prisma.userIdentity.upsert({
        where: { id: data.id },
        update: {
          email: data.email,
          password: data.password,
          emailVerified: data.emailVerified,
          emailVerificationToken: data.emailVerificationToken,
          lastLogin: data.lastLogin,
          failedLoginAttempts: data.failedLoginAttempts,
          lockedUntil: data.lockedUntil,
          passwordResetToken: data.passwordResetToken,
          passwordResetExpiry: data.passwordResetExpiry,
          updatedAt: data.updatedAt,
        },
        create: data,
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to save identity: ${error}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.userIdentity.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to delete identity: ${error}`));
    }
  }

  async findByEmailVerificationToken(
    token: string
  ): Promise<Either<Error, UserIdentity | null>> {
    try {
      const identity = await this.prisma.userIdentity.findFirst({
        where: { emailVerificationToken: token },
      });

      if (!identity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(identity));
    } catch (error) {
      return left(
        new Error(`Failed to find identity by verification token: ${error}`)
      );
    }
  }

  async saveMany(identities: UserIdentity[]): Promise<Either<Error, void>> {
    try {
      const data = identities.map(UserIdentityMapper.toPersistence);

      await this.prisma.userIdentity.createMany({
        data,
        skipDuplicates: true,
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to save multiple identities: ${error}`));
    }
  }
}
```

#### Implementation Rules:

1. **Always use try-catch** blocks
2. **Return right(null)** for not found, not an error
3. **Use mappers** to convert between domain and persistence
4. **Include descriptive error messages**
5. **Use upsert** for save operations (create or update)
6. **Handle JSON fields** properly (parse/stringify as needed)
7. **Use transactions** when modifying multiple tables

### 3. Create the Mapper

Location: `src/domain/{bounded-context}/application/mappers/{entity}.mapper.ts`

```typescript
// src/domain/auth/application/mappers/user-identity.mapper.ts
import { UserIdentity as PrismaUserIdentity } from '@prisma/client';
import { UserIdentity } from '../../enterprise/entities/user-identity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Email } from '../../enterprise/value-objects/email.vo';
import { Password } from '../../enterprise/value-objects/password.vo';

export class UserIdentityMapper {
  static toDomain(raw: PrismaUserIdentity): UserIdentity {
    return UserIdentity.create(
      {
        email: Email.createFromTrustedSource(raw.email),
        password: Password.createFromHash(raw.password),
        emailVerified: raw.emailVerified,
        emailVerificationToken: raw.emailVerificationToken,
        lastLogin: raw.lastLogin,
        failedLoginAttempts: raw.failedLoginAttempts,
        lockedUntil: raw.lockedUntil,
        passwordResetToken: raw.passwordResetToken,
        passwordResetExpiry: raw.passwordResetExpiry,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(identity: UserIdentity) {
    return {
      id: identity.id.toString(),
      email: identity.email.value,
      password: identity.password.value,
      emailVerified: identity.emailVerified,
      emailVerificationToken: identity.emailVerificationToken,
      lastLogin: identity.lastLogin,
      failedLoginAttempts: identity.failedLoginAttempts,
      lockedUntil: identity.lockedUntil,
      passwordResetToken: identity.passwordResetToken,
      passwordResetExpiry: identity.passwordResetExpiry,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    };
  }
}
```

#### Mapper Rules:

1. **Handle Value Objects** properly (use factory methods)
2. **Handle JSON fields** (parse strings to objects/arrays)
3. **Use createFromTrustedSource** for VOs from database
4. **Map null/undefined** values correctly
5. **Preserve all timestamps**

### 4. Module Configuration

Register repositories in the module:

```typescript
// src/infra/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { PrismaUserIdentityRepository } from '@/infra/database/prisma/repositories/prisma-user-identity-repository';

@Module({
  providers: [
    PrismaService,
    // Repository bindings
    {
      provide: IUserIdentityRepository,
      useClass: PrismaUserIdentityRepository,
    },
    // Also provide with string token for backward compatibility
    {
      provide: 'UserIdentityRepository',
      useExisting: IUserIdentityRepository,
    },
  ],
  exports: [
    IUserIdentityRepository,
    'UserIdentityRepository',
  ],
})
export class UserModule {}
```

### 5. Using Repositories in Use Cases

```typescript
// src/domain/auth/application/use-cases/authenticate.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IUserIdentityRepository } from '../repositories/i-user-identity-repository';

@Injectable()
export class AuthenticateUseCase {
  constructor(
    @Inject(IUserIdentityRepository)
    private identityRepo: IUserIdentityRepository,
  ) {}

  async execute(email: string, password: string) {
    const result = await this.identityRepo.findByEmail(email);
    
    if (result.isLeft()) {
      return left(new Error('Repository error'));
    }

    const identity = result.value;
    if (!identity) {
      return left(new Error('Invalid credentials'));
    }

    // Business logic here...
  }
}
```

## Common Patterns and Best Practices

### 1. Aggregated Views for Complex Queries

When you need to join multiple aggregates for read operations:

```typescript
// Create a read model
export interface UserAggregatedView {
  identityId: string;
  email: string;
  fullName: string;
  nationalId: string;
  role: string;
  // ... other fields from multiple aggregates
}

// Separate repository for views
export abstract class IUserAggregatedViewRepository {
  abstract findWithFilters(
    filters: UserFilters,
    pagination: PaginationParams,
  ): Promise<Either<Error, PaginatedResult<UserAggregatedView>>>;
}
```

### 2. Handling Related Aggregates

Each aggregate should have its own repository. Don't load entire aggregate graphs:

```typescript
// ❌ Wrong - Loading too much
interface IUserRepository {
  findByIdWithProfileAndAuthorization(id: string): Promise<...>;
}

// ✅ Correct - Separate repositories
const identity = await identityRepo.findById(id);
const profile = await profileRepo.findByIdentityId(id);
const auth = await authRepo.findByIdentityId(id);
```

### 3. Transaction Support

When you need to modify multiple aggregates atomically:

```typescript
async executeInTransaction<T>(
  work: (tx: PrismaTransactionClient) => Promise<T>
): Promise<Either<Error, T>> {
  try {
    const result = await this.prisma.$transaction(async (tx) => {
      return await work(tx);
    });
    return right(result);
  } catch (error) {
    return left(new Error(`Transaction failed: ${error}`));
  }
}
```

### 4. Testing Repositories

Create in-memory implementations for unit tests:

```typescript
// src/test/repositories/in-memory-user-identity-repository.ts
export class InMemoryUserIdentityRepository implements IUserIdentityRepository {
  private items: UserIdentity[] = [];

  async findById(id: string): Promise<Either<Error, UserIdentity | null>> {
    const identity = this.items.find(item => item.id.toString() === id);
    return right(identity || null);
  }

  async save(identity: UserIdentity): Promise<Either<Error, void>> {
    const index = this.items.findIndex(item => item.id.equals(identity.id));
    if (index >= 0) {
      this.items[index] = identity;
    } else {
      this.items.push(identity);
    }
    return right(undefined);
  }
}
```

## Checklist for New Repository

- [ ] Create interface in domain layer
- [ ] Use abstract class with abstract methods
- [ ] All methods return `Either<Error, T>`
- [ ] Create Prisma implementation
- [ ] Create mapper for domain/persistence conversion
- [ ] Handle JSON fields properly in mapper
- [ ] Register in module providers
- [ ] Export from module
- [ ] Create in-memory implementation for tests
- [ ] Add integration tests for Prisma implementation

## Common Pitfalls to Avoid

1. **Don't expose Prisma types** in domain interfaces
2. **Don't throw exceptions** - use Either for errors
3. **Don't forget to handle null** from Prisma queries
4. **Don't mix aggregates** in a single repository
5. **Don't use raw SQL** unless absolutely necessary
6. **Don't forget transactions** for multi-table operations
7. **Don't parse JSON in repositories** - do it in mappers

## References

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)