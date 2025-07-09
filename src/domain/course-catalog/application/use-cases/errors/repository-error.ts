// src/domain/course-catalog/application/use-cases/errors/repository-error.ts
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
  }
}
