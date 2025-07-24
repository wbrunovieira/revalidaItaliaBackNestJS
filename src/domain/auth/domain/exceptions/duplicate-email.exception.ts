// src/domain/auth/domain/exceptions/duplicate-email.exception.ts
import { AggregateConflictException } from '@/core/domain/exceptions';

/**
 * Exception thrown when attempting to register a duplicate email
 *
 * Maintains backward compatibility with DuplicateEmailError
 */
export class DuplicateEmailError extends AggregateConflictException {
  constructor(email: string) {
    super('User', 'Email already registered', {
      email,
      suggestion: 'Try recovering your password or use a different email',
    });

    // Override code for specific error tracking
    this._code = 'USER.EMAIL.DUPLICATE';
  }
}
