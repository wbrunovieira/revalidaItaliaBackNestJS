// src/domain/auth/domain/exceptions/resource-not-found-error.exception.ts
import { EntityNotFoundException } from '@/core/domain/exceptions';

/**
 * Exception thrown when a resource is not found
 *
 * This is an alias for EntityNotFoundException to maintain backward compatibility
 * and provide domain-specific semantics
 */
export class ResourceNotFoundError extends EntityNotFoundException {
  /**
   * Factory method for type-based searches
   */
  static withType(resourceType: string): ResourceNotFoundError {
    return new ResourceNotFoundError(resourceType, {}, undefined);
  }

  /**
   * Factory method for ID-based searches
   */
  static withId(entityName: string, id: string): ResourceNotFoundError {
    return new ResourceNotFoundError(
      entityName,
      { id },
      id,
      `${entityName} with ID ${id} not found`,
    );
  }

  /**
   * Factory method with custom message
   */
  static withMessage(message: string): ResourceNotFoundError {
    const error = new ResourceNotFoundError('Resource', {});
    // Override the message
    Object.defineProperty(error, 'message', {
      value: message,
      writable: false,
      enumerable: true,
      configurable: true,
    });
    return error;
  }
}
