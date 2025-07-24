// src/domain/auth/domain/exceptions/unauthorized-error.exception.ts
import { BusinessRuleException } from '@/core/domain/exceptions';

/**
 * Exception thrown when user lacks authorization
 *
 * Used for permission/role-based access violations
 */
export class UnauthorizedError extends BusinessRuleException {
  constructor(message?: string) {
    super(
      message || 'You do not have permission to perform this action',
      'AUTH.UNAUTHORIZED',
      {
        reason: 'Insufficient permissions',
      },
    );
  }

  static insufficientRole(
    requiredRole: string,
    currentRole?: string,
  ): UnauthorizedError {
    const error = new UnauthorizedError(
      `This action requires ${requiredRole} role`,
    );
    error.context.requiredRole = requiredRole;
    if (currentRole) {
      error.context.currentRole = currentRole;
    }
    return error;
  }

  static resourceAccessDenied(
    resourceType: string,
    resourceId?: string,
  ): UnauthorizedError {
    const error = new UnauthorizedError(`Access denied to ${resourceType}`);
    error.context.resourceType = resourceType;
    if (resourceId) {
      error.context.resourceId = resourceId;
    }
    return error;
  }
}
