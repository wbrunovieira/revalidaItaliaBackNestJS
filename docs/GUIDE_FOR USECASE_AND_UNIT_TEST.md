# Guide to Creating Use Cases and Unit Tests

This guide outlines the process and considerations when developing new use cases and their corresponding unit tests, following the project's conventions and best practices.

## 1. Understanding the Domain and Requirements

Before writing any code, thoroughly understand the feature's requirements and its impact on the domain.

### 1.1 Analyze `schema.prisma`

- **Purpose:** To understand the data model, relationships, and constraints relevant to the use case.
- **Action:**
  - Identify the primary entities involved (e.g., `Assessment`, `Lesson`).
  - Note their fields, types, and any default values or unique constraints.
  - Understand relationships between entities (e.g., `Assessment` to `Lesson`).
  - Pay attention to enums and their allowed values, as these often translate directly to validation rules.

### 1.2 Identify Core Entities and Aggregates

- Based on the `schema.prisma` and domain understanding, pinpoint the core domain entities and aggregates that the use case will interact with.
- Understand their properties, behaviors, and invariants.

## 2. Designing the Use Case

### 2.1 Define the Use Case Interface

- **Input (Request DTO):**
  - Create a Data Transfer Object (DTO) for the use case's input. This DTO should contain all necessary data for the operation.
  - Ensure it reflects the fields required by the domain entities and any specific business rules.
- **Output (Response DTO):**
  - Define a DTO for the use case's output. This should contain the data returned upon successful execution.
  - For creation use cases, this typically includes the newly created entity's data.
- **Error Handling (Either Type):**
  - Use the `Either` type (`left` for errors, `right` for success) for the use case's return type.
  - Define specific error types for business rule violations (e.g., `DuplicateAssessmentError`, `LessonNotFoundError`, `InvalidInputError`) and generic `RepositoryError` for infrastructure issues.

### 2.2 Identify Required Repositories

- Determine which domain repositories are needed to interact with the persistence layer (e.g., `IAssessmentRepository`, `ILessonRepository`).
- Define the necessary methods on these repository interfaces (e.g., `findById`, `findByTitle`, `create`).

#### Repository Interfaces and Implementations

- **Interfaces (e.g., `IAssessmentRepository`):** These define the contract for data access operations. They specify _what_ operations can be performed, abstracting away the _how_. This is crucial for maintaining a clean architecture and enabling dependency inversion.
- **In-Memory Repositories (e.g., `InMemoryAssessmentRepository`):** These are used primarily for unit testing. They implement the repository interfaces and simulate data storage in memory, allowing tests to run quickly and without external dependencies. Ensure that all methods defined in the interface are correctly implemented here for testing purposes.
- **Prisma Repositories (e.g., `PrismaAssessmentRepository`):** These are the actual persistence implementations, connecting to the database via Prisma. They also implement the same repository interfaces, ensuring that the application's business logic remains decoupled from the specific database technology. Verify that all interface methods are correctly mapped to Prisma operations.

## 3. Implementing the Use Case Logic

### 3.1 Input Validation
- **Technology:** Utilize `class-validator` decorators on the input DTO.
- **Process:**
    - Define validation rules directly on the DTO properties using decorators (e.g., `@IsString()`, `@IsEnum()`, `@Min()`, `@Max()`, `@ValidateIf()`).
    - Use `@ValidateIf()` for conditional validations based on other properties (e.g., `quizPosition` only for `QUIZ` type).
    - In the use case, create an instance of the input DTO, assign the request data to it, and then use the `validate` function from `class-validator`.
    - Return `InvalidInputError` if validation fails, mapping the `class-validator` errors to a readable format.

### 3.2 Business Logic Execution

- **Orchestration:** The use case should orchestrate calls to repositories and domain entities. It should not contain complex business logic itself; rather, it should delegate to the domain entities.
- **Domain Entity Creation/Manipulation:** Create or update domain entities using their factory methods or constructors.
- **Error Handling:**
  - Handle errors returned by repository calls (e.g., `findByTitle` returning `left` for "not found" vs. actual repository errors).
  - Throw or return specific business errors when invariants are violated (e.g., `DuplicateAssessmentError`).
  - Wrap infrastructure-level errors (e.g., database connection issues) in a generic `RepositoryError`.

## 4. Writing Unit Tests

Unit tests are crucial for ensuring the correctness and robustness of the use case.

### 4.1 Setup (beforeEach)

- Initialize in-memory repositories and the use case instance before each test.
- Mock external dependencies (e.g., `lessonRepo.findById`) to control their behavior and isolate the use case under test.

### 4.2 Test Scenarios

- **Successful Creation:**
  - Test the happy path for each valid type of assessment (e.g., `QUIZ`, `SIMULADO`, `PROVA_ABERTA`).
  - Verify that the created entity's properties match the input and expected defaults.
  - Assert that the entity is persisted in the repository.
- **Validation Errors (`InvalidInputError`):**
  - Test all defined validation rules.
  - Use `it.each` for multiple similar validation scenarios.
  - Assert that the use case returns `left(InvalidInputError)` and check the `details` property for specific error messages.
- **Business Rule Errors:**
  - Test scenarios where business invariants are violated (e.g., duplicate title, non-existent lesson).
  - Assert that the use case returns `left` with the specific business error type (e.g., `DuplicateAssessmentError`, `LessonNotFoundError`).
- **Repository/Infrastructure Errors (`RepositoryError`):**
  - Mock repository methods to simulate various failure conditions (e.g., database errors, network issues).
  - Assert that the use case correctly catches these errors and returns `left(RepositoryError)`.
  - Ensure that the use case differentiates between "not found" (expected behavior for some queries) and actual errors from the repository.

### 4.3 Mocking Strategy

- Use `vi.spyOn` (Vitest) to mock repository methods.
- Use `mockResolvedValueOnce` or `mockResolvedValue` to control the return values of mocked asynchronous functions.
- For error scenarios, use `mockResolvedValueOnce(left(new Error('...')))` or `mockRejectedValueOnce(new Error('...'))` as appropriate.

## 5. Iteration and Refinement

- Run tests frequently during development.
- Refine the use case logic and validation schema based on test failures.
- Ensure all edge cases and error paths are covered.
- Maintain clear and concise test descriptions.
