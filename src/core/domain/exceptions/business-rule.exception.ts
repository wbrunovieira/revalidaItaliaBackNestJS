// src/core/domain/exceptions/business-rule.exception.ts
import { DomainException } from './domain.exception';

/**
 * Exception thrown when a business rule is violated
 *
 * Use this for domain invariants and business logic violations
 */
export class BusinessRuleException extends DomainException {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    aggregateId?: string,
  ) {
    super(message, code, context, aggregateId);
  }

  /**
   * Factory method for invariant violations
   */
  static invariantViolation(
    rule: string,
    aggregateId?: string,
    context?: Record<string, any>,
  ): BusinessRuleException {
    return new BusinessRuleException(
      `Business invariant violated: ${rule}`,
      'DOMAIN.INVARIANT_VIOLATION',
      { rule, ...context },
      aggregateId,
    );
  }

  /**
   * Factory method for precondition failures
   */
  static preconditionFailed(
    condition: string,
    aggregateId?: string,
    context?: Record<string, any>,
  ): BusinessRuleException {
    return new BusinessRuleException(
      `Precondition failed: ${condition}`,
      'DOMAIN.PRECONDITION_FAILED',
      { condition, ...context },
      aggregateId,
    );
  }
}
