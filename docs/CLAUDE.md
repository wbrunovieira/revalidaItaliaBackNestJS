# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: Always start your session by running `/exec-prompt` to load the complete development guidelines and coding standards for this project. This ensures consistent code quality and adherence to project patterns.

Additional specialized commands are available:

- `/create-entity` - Create DDD entities
- `/create-repository` - Create repository interfaces and implementations
- `/create-use-case` - Create use cases with tests
- `/create-controller` - Create controllers with tests
- `/create-e2e-test` - Create E2E tests

## Docker Setup

The application runs in Docker containers:

- **Backend**: `ead-backend-dev` (port 3333)
- **Database**: `revalida_postgres` (PostgreSQL 16, port 5432)

### Docker Commands

- `docker compose up -d` - Start all services in detached mode
- `docker compose down` - Stop all services
- `docker compose logs -f` - View logs from all services
- `docker compose logs -f ead-backend-dev` - View backend logs only
- `docker ps` - List running containers
- `docker compose restart ead-backend-dev` - Restart backend service

## Commands

### Development (via Docker)

- `docker exec ead-backend-dev pnpm install` - Install dependencies
- `docker exec ead-backend-dev pnpm run start:dev` - Start development server with watch mode
- `docker exec ead-backend-dev pnpm run start` - Start production server
- `docker exec ead-backend-dev pnpm run build` - Build the project

### Testing (via Docker)

- `docker exec ead-backend-dev pnpm test` - Run unit tests with Vitest
- `docker exec ead-backend-dev pnpm test:e2e` - Run e2e tests (requires Prisma migration)
- Run single test: `docker exec ead-backend-dev pnpm vitest run src/path/to/test.spec.ts`
- Run specific test file: `docker exec -it ead-backend-dev sh -c "pnpm test src/path/to/test.spec.ts"`

### Database (via Docker)

- `docker exec ead-backend-dev pnpm run prisma:generate` - Generate Prisma client
- `docker exec ead-backend-dev pnpm run prisma:migrate` - Run Prisma migrations
- `docker exec ead-backend-dev pnpm run seed` - Run database seed script
- `docker exec ead-backend-dev pnpm run seed:dev` - Run development seed script

### Code Quality (via Docker)

- `docker exec ead-backend-dev pnpm run lint` - Run ESLint with auto-fix
- `docker exec ead-backend-dev pnpm run format` - Format code with Prettier

### Direct Container Access

- `docker exec -it ead-backend-dev sh` - Access backend container shell
- `docker exec -it revalida_postgres psql -U admin -d ead_db` - Access PostgreSQL directly

## Commands

...

## Troubleshooting

Common issues and solutions:

### Container Issues

- **Container won't start**: `docker compose down && docker compose up -d`
- **Backend container keeps restarting**: Check logs with `docker compose logs -f ead-backend-dev`

### Database Issues

- **Migration errors**: `docker exec ead-backend-dev pnpm prisma:migrate:reset`
- **Connection refused**: Ensure PostgreSQL is healthy: `docker ps`

### Development Issues

- **Changes not reflecting**: Restart the backend: `docker compose restart ead-backend-dev`
- **Port already in use**: Kill process using port 3333 or change port in docker-compose

#### Important: Hot Reload Limitations

- Changes to entities, repositories, and controllers may require a rebuild
- Run `docker exec ead-backend-dev pnpm run build` in background
- Or restart the dev server: `docker compose restart ead-backend-dev`

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
domain/
├── application/
│ ├── dtos/ # Data Transfer Objects
│ ├── repositories/ # Repository interfaces
│ └── use-cases/ # Business use cases with tests
│ └── validations/ # Zod validation schemas
└── enterprise/
├── entities/ # Domain entities
└── value-objects/ # Domain value objects

### Key Technologies

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest for unit tests, includes e2e tests
- **Validation**: Zod schemas for input validation
- **Authentication**: JWT with Passport strategies
- **Video Integration**: PandaVideo provider
- **Container**: Docker with Alpine Linux

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

**🚨 CRITICAL TESTING PRINCIPLE**:
When tests fail, **ALWAYS** fix the system implementation to make the tests pass, **NEVER** adjust the tests to match incorrect system behavior. Each test level is a specification that must be respected!

- **Unit Tests** (`/create-use-case`): Represent the truth of business rules and domain logic. When a use-case test fails, fix the implementation in the use-case, entity, or value object.

- **Controller Tests** (`/create-controller`): Represent the truth of the API contract. When a controller test fails, fix the controller implementation, DTOs, or status codes.

- **E2E Tests** (`/create-e2e-test`): Represent the truth of the complete system behavior. When an E2E test fails, trace through all layers (controller → use-case → repository) to fix the issue.

Each test type serves as the source of truth for its respective level. Tests are specifications, not suggestions!

### Development Notes

- Uses Clean Architecture principles with dependency inversion
- Domain entities are framework-agnostic
- Controllers handle HTTP concerns, use cases handle business logic
- Extensive use of DTOs for data validation and transformation
- Multi-language support with translation value objects
- All commands should be run through Docker containers for consistency
- Backend runs on port 3333, database on port 5432
