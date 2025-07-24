// src/domain/auth/domain/exceptions/repository-error.exception.ts
import { DomainException } from '@/core/domain/exceptions';

/**
 * Exception thrown when repository operations fail
 *
 * This is a technical exception, not a business rule violation
 */
export class RepositoryError extends DomainException {
  constructor(message: string, operation?: string, originalError?: any) {
    super(message, 'INFRASTRUCTURE.REPOSITORY_ERROR', {
      operation,
      originalError: originalError?.message || originalError,
    });
  }

  static operationFailed(operation: string, error?: any): RepositoryError {
    return new RepositoryError(
      `Repository operation failed: ${operation}`,
      operation,
      error,
    );
  }

  static connectionFailed(error?: any): RepositoryError {
    return new RepositoryError('Database connection failed', 'connect', error);
  }

  static transactionFailed(error?: any): RepositoryError {
    return new RepositoryError(
      'Database transaction failed',
      'transaction',
      error,
    );
  }
}
