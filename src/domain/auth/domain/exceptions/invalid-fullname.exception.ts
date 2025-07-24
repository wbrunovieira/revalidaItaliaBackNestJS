import { BusinessRuleException } from '@/core/domain/exceptions/business-rule.exception';

/**
 * Exception thrown when fullName validation fails
 */
export class InvalidFullNameException extends BusinessRuleException {
  constructor(reason: string) {
    super(
      `Invalid full name: ${reason}`,
      'AUTH.INVALID_FULL_NAME',
      { reason }
    );
  }

  static empty(): InvalidFullNameException {
    return new InvalidFullNameException('Full name cannot be empty');
  }

  static tooShort(minLength: number): InvalidFullNameException {
    return new InvalidFullNameException(`Full name must be at least ${minLength} characters`);
  }

  static invalidCharacters(): InvalidFullNameException {
    return new InvalidFullNameException('Full name contains invalid characters');
  }
}