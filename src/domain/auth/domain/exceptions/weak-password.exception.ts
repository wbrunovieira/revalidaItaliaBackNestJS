// src/domain/auth/domain/exceptions/weak-password.exception.ts
import { BusinessRuleException } from '@/core/domain/exceptions';

/**
 * Exception thrown when password doesn't meet security requirements
 */
export class WeakPasswordException extends BusinessRuleException {
  constructor(reason: string) {
    super(
      `Password does not meet security requirements: ${reason}`,
      'USER.PASSWORD.WEAK',
      {
        reason,
        requirements: {
          minLength: 6,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
        },
      },
    );
  }

  static tooShort(length: number, minLength: number): WeakPasswordException {
    return new WeakPasswordException(
      `Password must be at least ${minLength} characters (got ${length})`,
    );
  }

  static missingUppercase(): WeakPasswordException {
    return new WeakPasswordException(
      'Password must contain at least one uppercase letter',
    );
  }

  static missingLowercase(): WeakPasswordException {
    return new WeakPasswordException(
      'Password must contain at least one lowercase letter',
    );
  }

  static missingNumber(): WeakPasswordException {
    return new WeakPasswordException(
      'Password must contain at least one number',
    );
  }

  static tooCommon(): WeakPasswordException {
    return new WeakPasswordException(
      'Password is too common or easily guessable',
    );
  }
}
