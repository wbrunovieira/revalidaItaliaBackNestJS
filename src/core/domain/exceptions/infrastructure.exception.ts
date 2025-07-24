// src/core/domain/exceptions/infrastructure.exception.ts
import { DomainException } from './domain.exception';

/**
 * Base exception for infrastructure-related errors
 *
 * Use this for errors that occur in the infrastructure layer,
 * such as database errors, external service failures, etc.
 */
export class InfrastructureException extends DomainException {
  constructor(
    message: string,
    code?: string,
    context?: Record<string, any>,
    aggregateId?: string,
  ) {
    super(message, code || 'INFRASTRUCTURE.ERROR', context, aggregateId);
  }
}
