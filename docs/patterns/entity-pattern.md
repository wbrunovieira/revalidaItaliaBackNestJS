# Entity Pattern Guide

This guide establishes the standard pattern for creating entities in our Domain-Driven Design (DDD) architecture. All entities must follow this pattern to ensure consistency across the codebase.

## Table of Contents

1. [File Structure](#file-structure)
2. [Entity Anatomy](#entity-anatomy)
3. [When to Use Value Objects](#when-to-use-value-objects)
4. [Domain Events](#domain-events)
5. [Code Organization](#code-organization)
6. [Complete Example](#complete-example)

## File Structure

Entities are located in the domain layer under the `enterprise/entities` directory:

```
src/
└── domain/
    └── [bounded-context]/
        └── enterprise/
            ├── entities/
            │   └── [entity-name].entity.ts
            ├── value-objects/
            │   └── [value-object-name].vo.ts
            └── events/
                └── [event-name].event.ts
```

## Entity Anatomy

### 1. Imports Section

Group imports logically:
- Core framework imports first
- Domain layer imports second
- Value Objects and Events last

```typescript
// Core imports
import { AggregateRoot } from '@/core/domain/aggregate-root';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

// Domain imports
import { UserCreatedEvent, UserCreationSource } from '../events/user-created.event';
import { UserRole, UserRoleType } from '../value-objects/user-role.vo';
import { Email } from '../value-objects/email.vo';
import { NationalId } from '../value-objects/national-id.vo';
```

### 2. Interfaces Section

Define two interfaces:
- **Internal Props Interface**: Uses Value Objects for type safety
- **Creation Props Interface**: Uses primitives for external API

```typescript
// =====================================
// = Interfaces
// =====================================

/**
 * Internal props - uses Value Objects
 */
interface UserProps {
  name: string;
  email: Email;
  password: string;
  nationalId: NationalId;
  role: UserRole;
  // Optional fields
  phone?: string;
  lastLogin?: Date;
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for creation - receives primitives
 */
export interface CreateUserProps {
  name: string;
  email: string;
  password: string;
  nationalId: string;
  role: UserRoleType;
  // Optional fields
  phone?: string;
  lastLogin?: Date;
  // Audit fields (optional for creation)
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 3. Entity Class

```typescript
// =====================================
// = Entity
// =====================================

/**
 * User Aggregate Root
 * 
 * Central entity in the Auth bounded context.
 * Manages user identity, authentication, and authorization.
 */
export class User extends AggregateRoot<UserProps> {
  // Methods organized by sections...
}
```

### 4. Method Organization

Methods must be organized in this specific order with section comments:

```typescript
export class User extends AggregateRoot<UserProps> {
  // ===== Response Methods =====
  
  toResponseObject(): Omit<CreateUserProps, 'password'> & { id: string } {
    // Convert VOs back to primitives for API responses
  }

  // ===== Getters =====
  
  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  // ===== Private Methods =====
  
  private touch() {
    this.props.updatedAt = new Date();
  }

  // ===== Public Methods =====
  
  public updateProfile(updates: { name?: string; email?: string }) {
    // Business logic here
    this.touch();
  }

  // ===== Static Factory Methods =====
  
  public static create(
    props: Optional<CreateUserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    // Creation logic
  }
}
```

## When to Use Value Objects

Create a Value Object when a property:

1. **Has validation rules**
   ```typescript
   // Email must be valid format
   email: Email
   ```

2. **Has business behavior**
   ```typescript
   // NationalId can be normalized and masked
   nationalId: NationalId
   ```

3. **Encapsulates business rules**
   ```typescript
   // UserRole determines permissions
   role: UserRole
   ```

4. **Requires immutability**
   - Value Objects are immutable by design
   - Changes create new instances

### Value Object Checklist

✅ Create a VO if the property:
- Needs validation beyond simple type checking
- Has formatting or transformation logic
- Contains business rules or behaviors
- Benefits from type safety and immutability

❌ Keep as primitive if the property:
- Is a simple string/number without rules
- Has no special behavior
- Is only used for storage

Example decisions:
- `name: string` - Simple string, no special rules
- `email: Email` - Needs validation, has domain (business email check)
- `password: string` - Handled by auth layer, not domain concern
- `nationalId: NationalId` - Has normalization and masking behavior
- `role: UserRole` - Contains permission rules

## Domain Events

### When to Create Events

Create domain events for significant state changes:

1. **Entity Creation**
   ```typescript
   UserCreatedEvent
   ```

2. **Important State Changes**
   ```typescript
   UserRoleChangedEvent
   UserDeactivatedEvent
   ```

3. **Business Milestones**
   ```typescript
   UserCompletedOnboardingEvent
   UserSubscriptionExpiredEvent
   ```

### Event Creation Pattern

In the static factory method:

```typescript
public static create(
  props: CreateUserProps,
  id?: UniqueEntityID,
  source: UserCreationSource = 'api',
) {
  const user = new User(props, id);

  // Add event only for new entities
  const isNewUser = !id;
  if (isNewUser) {
    user.addDomainEvent(new UserCreatedEvent(user, source));
  }

  return user;
}
```

### Where Events Are Dispatched

Events are dispatched in repositories after successful persistence:

```typescript
// In repository implementation
async create(user: User): Promise<Either<Error, void>> {
  // Save to database
  await this.prisma.user.create({ data });
  
  // Dispatch events after successful save
  user.dispatchEvents();
  
  return right(undefined);
}
```

## Code Organization

### 1. Section Separators

Use consistent separators:

```typescript
// =====================================
// = Section Name
// =====================================
```

### 2. Method Section Separators

Within classes:

```typescript
// ===== Section Name =====
```

### 3. Spacing Rules

- 1 blank line between imports groups
- 1 blank line before section separators
- 1 blank line between methods
- 2 blank lines before major sections

### 4. Comment Standards

```typescript
/**
 * Class/Method description
 * 
 * Additional details if needed.
 * 
 * @example
 * const user = User.create({ ... });
 * 
 * @param props - Creation properties
 * @returns User instance
 */
```

### 5. Method Ordering

Always maintain this order:
1. Response/Serialization methods
2. Getters
3. Private methods
4. Public methods (business logic)
5. Static factory methods

## Complete Example

Here's a complete example following all patterns:

```typescript
// src/domain/auth/enterprise/entities/user.entity.ts
import { AggregateRoot } from '@/core/domain/aggregate-root';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

import { UserCreatedEvent, UserCreationSource } from '../events/user-created.event';
import { UserRole, UserRoleType } from '../value-objects/user-role.vo';
import { Email } from '../value-objects/email.vo';
import { NationalId } from '../value-objects/national-id.vo';

// =====================================
// = Interfaces
// =====================================

/**
 * Internal props - uses Value Objects
 */
interface UserProps {
  name: string;
  email: Email;
  password: string;
  nationalId: NationalId;
  role: UserRole;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for creation - receives primitives
 */
export interface CreateUserProps {
  name: string;
  email: string;
  password: string;
  nationalId: string;
  role: UserRoleType;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================
// = Entity
// =====================================

/**
 * User Aggregate Root
 * 
 * Central entity in the Auth bounded context.
 * Manages user identity, authentication, and authorization.
 */
export class User extends AggregateRoot<UserProps> {
  // ===== Response Methods =====
  
  toResponseObject(): Omit<CreateUserProps, 'password'> & { id: string } {
    const { password, role, email, nationalId, ...rest } = this.props;
    return { 
      id: this.id.toString(), 
      ...rest,
      email: email.value,
      nationalId: nationalId.value,
      role: role.value 
    };
  }

  // ===== Getters =====
  
  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get nationalId(): NationalId {
    return this.props.nationalId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ===== Private Methods =====
  
  private touch() {
    this.props.updatedAt = new Date();
  }

  // ===== Public Methods =====
  
  /**
   * Update user profile information
   */
  public updateProfile(updates: {
    name?: string;
    email?: string;
    nationalId?: string;
    role?: UserRoleType;
  }) {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
      this.touch();
    }
    if (updates.email !== undefined) {
      this.props.email = Email.create(updates.email);
      this.touch();
    }
    if (updates.nationalId !== undefined) {
      this.props.nationalId = NationalId.create(updates.nationalId);
      this.touch();
    }
    if (updates.role !== undefined) {
      this.props.role = UserRole.create(updates.role);
      this.touch();
    }
  }

  /**
   * Update user last login timestamp
   */
  public updateLastLogin() {
    this.props.lastLogin = new Date();
    this.touch();
  }

  // ===== Static Factory Methods =====
  
  /**
   * Create a new User entity
   */
  public static create(
    props: Optional<CreateUserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
    source: UserCreationSource = 'api',
  ) {
    const now = new Date();
    
    // Convert primitives to Value Objects
    const userProps: UserProps = {
      ...props,
      email: Email.create(props.email),
      nationalId: NationalId.create(props.nationalId),
      role: UserRole.create(props.role),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
    
    const user = new User(userProps, id);

    // Add domain event for new users
    const isNewUser = !id;
    if (isNewUser) {
      user.addDomainEvent(new UserCreatedEvent(user, source));
    }

    return user;
  }
}
```

## Best Practices

1. **Always use Value Objects** for properties with business rules
2. **Keep entities focused** on their aggregate boundaries
3. **Dispatch events in repositories** for consistency
4. **Use the `touch()` method** for all modifications
5. **Convert between VOs and primitives** at boundaries
6. **Document complex business logic** with examples
7. **Maintain consistent formatting** across all entities

## Common Pitfalls to Avoid

1. ❌ Don't expose Value Object internals in public APIs
2. ❌ Don't dispatch events in entity methods
3. ❌ Don't forget to validate in Value Objects
4. ❌ Don't mix primitives and VOs in the same interface
5. ❌ Don't skip the section organization
6. ❌ Don't forget to update `updatedAt` on changes

## Checklist for New Entities

- [ ] Created internal props interface with VOs
- [ ] Created external props interface with primitives
- [ ] Added proper JSDoc documentation
- [ ] Organized methods in correct sections
- [ ] Added response/serialization method
- [ ] Created necessary Value Objects
- [ ] Identified and created domain events
- [ ] Added static factory method
- [ ] Implemented `touch()` for updates
- [ ] Followed spacing and formatting rules