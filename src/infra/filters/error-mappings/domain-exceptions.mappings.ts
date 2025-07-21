// src/infra/filters/error-mappings/domain-exceptions.mappings.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorMapping } from './shared.mappings';

/**
 * Error mappings for new domain exceptions
 * 
 * These complement existing mappings and handle the new exception hierarchy
 */
export const domainExceptionMappings: Record<string, ErrorMapping> = {
  // Business rule violations (422)
  BusinessRuleException: {
    type: 'business-rule-violation',
    title: 'Business Rule Violation',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) => error.message,
  },

  WeakPasswordException: {
    type: 'weak-password',
    title: 'Weak Password',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) => error.message,
  },

  InvalidEmailFormatException: {
    type: 'invalid-email-format',
    title: 'Invalid Email Format',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) => error.message,
  },

  // Entity not found (404)
  EntityNotFoundException: {
    type: 'entity-not-found',
    title: 'Not Found',
    status: HttpStatus.NOT_FOUND,
    extractDetail: (error) => error.message,
  },

  // Aggregate conflicts (409)
  AggregateConflictException: {
    type: 'conflict',
    title: 'Conflict',
    status: HttpStatus.CONFLICT,
    extractDetail: (error) => error.message,
  },

  // Repository errors (500)
  RepositoryError: {
    type: 'internal-error',
    title: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    extractDetail: (error) => 'An error occurred while processing your request',
  },

  // Authorization errors (403)
  UnauthorizedError: {
    type: 'forbidden',
    title: 'Forbidden',
    status: HttpStatus.FORBIDDEN,
    extractDetail: (error) => error.message || 'You do not have permission to perform this action',
  },
};