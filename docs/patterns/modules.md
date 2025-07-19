# Module Creation Standards

This document defines the standards and patterns for creating modules in the Revalida project. All developers must follow these guidelines to ensure consistency across the codebase.

## 📋 Module Creation Checklist

### 1. Information Gathering

Before creating a module, gather the following information:

- [ ] **Module name** (always SINGULAR: `UserModule`, not `UsersModule`)
- [ ] **Domain** it belongs to (`auth`, `course-catalog`, etc)
- [ ] **Controller** associated (if any)
- [ ] **Use Cases** the module will provide
- [ ] **Repository** it manages (if applicable)
- [ ] **Dependencies**:
  - Does it need `DatabaseModule`? (only if creating repositories)
  - Does it need other modules? (e.g., `AuthModule` for guards)
- [ ] **What to export** for other modules

### 2. File Structure

```typescript
// src/infra/modules/[singular-name]/[singular-name].module.ts
import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/infra/database/database.module';
import { [Name]Controller } from '@/infra/controllers/[name].controller';

import { I[Name]Repository } from '@/domain/[domain]/application/repositories/i-[name]-repository';
import { Prisma[Name]Repository } from '@/infra/database/prisma/repositories/prisma-[name]-repository';

import { [UseCase1] } from '@/domain/[domain]/application/use-cases/[use-case-1].use-case';
import { [UseCase2] } from '@/domain/[domain]/application/use-cases/[use-case-2].use-case';

/**
 * [Name] Module
 * 
 * [Brief description of what the module manages]
 * 
 * Note: [Any important separation of concerns]
 */
@Module({
  imports: [DatabaseModule], // Only if it has repository
  controllers: [[Name]Controller],
  providers: [
    [UseCase1],
    [UseCase2],

    // Repository binding
    {
      provide: I[Name]Repository,
      useClass: Prisma[Name]Repository,
    },

    // Internal configuration (not exported)
    {
      provide: '[CONFIG_NAME]',
      useValue: value,
    },
  ],
  exports: [
    I[Name]Repository,
    
    [UseCase1],
    [UseCase2],
  ],
})
export class [Name]Module {}
```

### 3. Import Rules

1. **Mandatory order**:
   ```typescript
   // 1. Framework/External
   import { Module } from '@nestjs/common';
   
   // 2. Infrastructure (modules, controllers)
   import { DatabaseModule } from '@/infra/database/database.module';
   import { XController } from '@/infra/controllers/x.controller';
   
   // 3. Domain - Repositories (interface + implementation together)
   import { IXRepository } from '@/domain/...';
   import { PrismaXRepository } from '@/infra/...';
   
   // 4. Domain - Use Cases
   import { CreateXUseCase } from '@/domain/...';
   ```

2. **Spacing**: One blank line between each group

### 4. Comment Rules

**✅ INCLUDE only**:
- Header with path: `// src/infra/modules/[name]/[name].module.ts`
- Module JSDoc explaining purpose
- `// Repository binding` before repository provider
- `// Internal configuration (not exported)` for internal configs

**❌ DO NOT include**:
- `// Controllers`, `// Use cases`, `// Repositories` in imports
- `// Export repository for other modules` in exports
- Obvious or redundant comments

### 5. Providers and Exports Rules

**Providers**:
1. Use cases first (alphabetical order)
2. Repository binding
3. Internal configurations last

**Exports**:
1. Repository first (if any)
2. Use cases after (same order as providers)
3. DO NOT export internal configurations (SALT_ROUNDS, etc)

### 6. Architectural Decisions

- **Import `DatabaseModule`** only if the module creates repositories
- **Module in singular** always: `AccountModule`, not `AccountsModule`
- **No business logic** in the module - only wiring/configuration
- **Exports are public** - only export what other modules need

### 7. Simple Module Example (without repository)

```typescript
// src/infra/modules/profile/profile.module.ts
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProfileController } from '@/infra/controllers/profile.controller';

import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/update-user-profile.use-case';

/**
 * Profile Module
 * 
 * Manages user profile updates. Uses AccountRepository from AuthModule.
 */
@Module({
  imports: [AuthModule], // No DatabaseModule needed
  controllers: [ProfileController],
  providers: [UpdateUserProfileUseCase],
  exports: [UpdateUserProfileUseCase],
})
export class ProfileModule {}
```

## 🎯 Quick Reference

### Module with Repository
- ✅ Import `DatabaseModule`
- ✅ Provide repository binding
- ✅ Export repository interface

### Module without Repository
- ❌ Don't import `DatabaseModule`
- ✅ Import modules that provide needed repositories
- ✅ Only provide use cases

### Naming Convention
- Module: `AccountModule` (singular)
- Controller: `AccountsController` (plural)
- Repository Interface: `IAccountRepository`
- Repository Implementation: `PrismaAccountRepository`
- Use Case: `CreateAccountUseCase`

## 📝 Final Checklist

Before submitting your module:

- [ ] File path includes comment header
- [ ] Imports are properly organized and spaced
- [ ] Module has JSDoc documentation
- [ ] Only necessary comments are included
- [ ] Providers are in correct order
- [ ] Exports only include public APIs
- [ ] Module name is singular
- [ ] Dependencies are minimal and justified