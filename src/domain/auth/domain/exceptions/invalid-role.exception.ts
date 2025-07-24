import { BusinessRuleException } from '@/core/domain/exceptions/business-rule.exception';

/**
 * Exception thrown when an invalid role is provided
 */
export class InvalidRoleException extends BusinessRuleException {
  constructor(providedRole: string, validRoles: string[]) {
    super(
      `Invalid role: ${providedRole}. Must be one of: ${validRoles.join(', ')}`,
      'AUTH.INVALID_ROLE',
      {
        providedRole,
        validRoles,
      },
    );
  }
}
