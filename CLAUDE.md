# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run start:dev` - Start development server with watch mode
- `pnpm run start` - Start production server
- `pnpm run build` - Build the project

### Testing
- `pnpm test` - Run unit tests with Vitest
- `pnpm test:e2e` - Run e2e tests (requires Prisma migration)
- Run single test: `pnpm vitest run src/path/to/test.spec.ts`

### Database
- `pnpm run prisma:generate` - Generate Prisma client
- `pnpm run prisma:migrate` - Run Prisma migrations
- `pnpm run seed` - Run database seed script

### Code Quality
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier

## Architecture

This is a NestJS application implementing Clean Architecture with Domain-Driven Design (DDD) principles:

### Core Structure
- **Domain Layer** (`src/domain/`): Pure business logic organized by bounded contexts
  - `auth/` - Authentication and user management
  - `course-catalog/` - Course, module, lesson, video, document management
- **Application Layer** (`src/application/`): Use cases and application services
- **Infrastructure Layer** (`src/infra/`): External adapters and implementations

### Domain Organization
Each domain follows the pattern:
```
domain/
├── application/
│   ├── dtos/           # Data Transfer Objects
│   ├── repositories/   # Repository interfaces
│   └── use-cases/      # Business use cases with tests
│       └── validations/ # Zod validation schemas
└── enterprise/
    ├── entities/       # Domain entities
    └── value-objects/  # Domain value objects
```

### Key Technologies
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest for unit tests, includes e2e tests
- **Validation**: Zod schemas for input validation
- **Authentication**: JWT with Passport strategies
- **Video Integration**: PandaVideo provider

### Repository Pattern
- Abstract interfaces defined in `domain/*/application/repositories/`
- Concrete implementations in `infra/database/prisma/repositories/`
- In-memory implementations for testing in `src/test/repositories/`

### Error Handling
- Domain-specific error classes in `domain/*/application/use-cases/errors/`
- Consistent error types: `*NotFoundError`, `*HasDependenciesError`, `Duplicate*Error`

### Testing Strategy
- Unit tests co-located with use cases (`.spec.ts` files)
- E2E tests in `test/e2e/` directory
- In-memory repositories for isolated unit testing
- Testcontainers for e2e database testing

### Development Notes
- Uses Clean Architecture principles with dependency inversion
- Domain entities are framework-agnostic
- Controllers handle HTTP concerns, use cases handle business logic
- Extensive use of DTOs for data validation and transformation
- Multi-language support with translation value objects