// src/core/domain/exceptions/entity-not-found.exception.ts
import { DomainException } from './domain.exception';

/**
 * Exception thrown when an entity is not found
 *
 * Use this when a required entity doesn't exist in the system
 */
export class EntityNotFoundException extends DomainException {
  constructor(
    entityName: string,
    criteria: Record<string, any>,
    aggregateId?: string,
    customMessage?: string,
  ) {
    const message = customMessage || `${entityName} not found`;
    const code = `DOMAIN.${entityName.toUpperCase()}_NOT_FOUND`;

    super(message, code, { entityName, criteria }, aggregateId);
  }

  /**
   * Factory method for ID-based searches
   */
  static withId(entityName: string, id: string): EntityNotFoundException {
    return new EntityNotFoundException(entityName, { id }, id);
  }

  /**
   * Factory method for criteria-based searches
   */
  static withCriteria(
    entityName: string,
    criteria: Record<string, any>,
  ): EntityNotFoundException {
    return new EntityNotFoundException(entityName, criteria);
  }
}
