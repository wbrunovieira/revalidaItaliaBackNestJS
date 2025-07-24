// src/domain/auth/domain/exceptions/invalid-input-error.exception.ts
import { BusinessRuleException } from '@/core/domain/exceptions';

/**
 * Exception thrown when input validation fails
 *
 * Used for general input validation errors not covered by specific VOs
 */
export class InvalidInputError extends BusinessRuleException {
  constructor(
    message: string,
    public readonly details: unknown[] = [],
  ) {
    super(message, 'VALIDATION.INVALID_INPUT', {
      details,
      count: details.length,
    });
  }

  static missingRequiredFields(fields: string[]): InvalidInputError {
    return new InvalidInputError(
      `Missing required fields: ${fields.join(', ')}`,
      fields.map((field) => ({ field, message: 'Field is required' })),
    );
  }

  static invalidFormat(
    field: string,
    expectedFormat: string,
  ): InvalidInputError {
    return new InvalidInputError(`Invalid format for field: ${field}`, [
      { field, expectedFormat, message: `Expected format: ${expectedFormat}` },
    ]);
  }
}
