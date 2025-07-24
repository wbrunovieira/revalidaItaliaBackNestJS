// src/core/domain/exceptions/aggregate-conflict.exception.ts
import { DomainException } from './domain.exception';

/**
 * Exception thrown when there's a conflict at the aggregate level
 *
 * Use this for concurrency issues, duplicate keys, or state conflicts
 */
export class AggregateConflictException extends DomainException {
  constructor(
    aggregateName: string,
    conflictType: string,
    context?: Record<string, any>,
    aggregateId?: string,
  ) {
    const message = `Conflict in ${aggregateName}: ${conflictType}`;
    const code = `DOMAIN.${aggregateName.toUpperCase()}_CONFLICT`;

    super(
      message,
      code,
      { aggregateName, conflictType, ...context },
      aggregateId,
    );
  }

  /**
   * Factory method for duplicate key conflicts
   */
  static duplicateKey(
    aggregateName: string,
    field: string,
    value: any,
    aggregateId?: string,
  ): AggregateConflictException {
    return new AggregateConflictException(
      aggregateName,
      `${field} already exists`,
      { field, value },
      aggregateId,
    );
  }

  /**
   * Factory method for concurrency conflicts
   */
  static concurrencyConflict(
    aggregateName: string,
    expectedVersion: number,
    currentVersion: number,
    aggregateId?: string,
  ): AggregateConflictException {
    return new AggregateConflictException(
      aggregateName,
      'Concurrent modification detected',
      { expectedVersion, currentVersion },
      aggregateId,
    );
  }
}
