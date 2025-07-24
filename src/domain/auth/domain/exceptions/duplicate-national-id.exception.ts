// src/domain/auth/domain/exceptions/duplicate-national-id.exception.ts
import { AggregateConflictException } from '@/core/domain/exceptions';

/**
 * Exception thrown when attempting to register a duplicate national ID
 *
 * Maintains backward compatibility with DuplicateNationalIdError
 */
export class DuplicateNationalIdError extends AggregateConflictException {
  constructor(nationalId: string) {
    super('User', 'National ID already registered', {
      nationalId: nationalId.substring(0, 3) + '***', // Partially hide for security
      suggestion: 'This national ID is already associated with an account',
    });

    // Override code for specific error tracking
    this._code = 'USER.NATIONALID.DUPLICATE';
  }
}
