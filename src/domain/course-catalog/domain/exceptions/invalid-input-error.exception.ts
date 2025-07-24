// src/domain/course-catalog/domain/exceptions/invalid-input-error.exception.ts
import { DomainException } from '@/core/domain/exceptions/domain.exception';

/**
 * Exception thrown when input validation fails
 */
export class InvalidInputError extends DomainException {
  constructor(
    message: string = 'Invalid input provided',
    public readonly details?: any[]
  ) {
    const code = 'VALIDATION.INVALID_INPUT';
    super(message, code, { details });
  }
}