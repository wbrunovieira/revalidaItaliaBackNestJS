// src/core/errors/repository-error.ts
/**
 * Repository Error
 * 
 * Generic error thrown by repository implementations when database
 * operations fail. This error should be caught by use cases and
 * either re-thrown or transformed into domain-specific errors.
 */
export class RepositoryError extends Error {
  constructor(
    message: string = 'An error occurred while accessing the repository',
    public readonly operation?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}