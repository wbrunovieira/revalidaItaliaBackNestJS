// src/domain/course-catalog/domain/exceptions/repository-error.exception.ts
import { InfrastructureException } from '@/core/domain/exceptions/infrastructure.exception';

/**
 * Exception thrown when a repository operation fails
 */
export class RepositoryError extends InfrastructureException {
  constructor(message: string, operation?: string, entityName?: string) {
    const code = 'REPOSITORY.OPERATION_FAILED';
    super(message, code, { operation, entityName });
  }

  static create(entityName: string, error?: Error): RepositoryError {
    return new RepositoryError(
      error?.message || `Failed to create ${entityName}`,
      'create',
      entityName,
    );
  }

  static update(entityName: string, error?: Error): RepositoryError {
    return new RepositoryError(
      error?.message || `Failed to update ${entityName}`,
      'update',
      entityName,
    );
  }

  static find(entityName: string, error?: Error): RepositoryError {
    return new RepositoryError(
      error?.message || `Failed to find ${entityName}`,
      'find',
      entityName,
    );
  }

  static delete(entityName: string, error?: Error): RepositoryError {
    return new RepositoryError(
      error?.message || `Failed to delete ${entityName}`,
      'delete',
      entityName,
    );
  }
}
