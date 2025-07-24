// src/domain/auth/domain/exceptions/invalid-email-format.exception.ts
import { BusinessRuleException } from '@/core/domain/exceptions';

/**
 * Exception thrown when email format is invalid
 */
export class InvalidEmailFormatException extends BusinessRuleException {
  constructor(email: string, reason?: string) {
    const message = reason
      ? `Invalid email format: ${reason}`
      : 'Invalid email format';

    super(message, 'USER.EMAIL.INVALID_FORMAT', {
      email,
      reason,
      pattern: 'user@example.com',
    });
  }

  static empty(): InvalidEmailFormatException {
    return new InvalidEmailFormatException('', 'Email cannot be empty');
  }

  static invalidPattern(email: string): InvalidEmailFormatException {
    return new InvalidEmailFormatException(
      email,
      'Email must be in format user@domain.com',
    );
  }

  static tooLong(
    email: string,
    maxLength: number,
  ): InvalidEmailFormatException {
    return new InvalidEmailFormatException(
      email,
      `Email must not exceed ${maxLength} characters`,
    );
  }
}
