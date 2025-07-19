// src/infra/filters/error-mappings/shared.mappings.ts
import { HttpStatus } from '@nestjs/common';

export interface ErrorMapping {
  type: string;
  title: string;
  status: HttpStatus;
  detail?: string;
  extractDetail?: (error: Error) => string;
  extractAdditionalData?: (error: Error) => any;
}

/**
 * Shared error mappings used across all domains
 * These handle generic errors that can occur in any module
 */
export const sharedErrorMappings: Record<string, ErrorMapping> = {
  // Validation errors (400)
  InvalidInputError: {
    type: 'validation-failed',
    title: 'Validation Failed',
    status: HttpStatus.BAD_REQUEST,
    detail: 'One or more fields failed validation',
    extractAdditionalData: (error: any) => ({
      errors: { details: sanitizeValidationErrors(error.details) },
    }),
  },

  // Not found errors (404)
  ResourceNotFoundError: {
    type: 'resource-not-found',
    title: 'Resource Not Found',
    status: HttpStatus.NOT_FOUND,
    detail: 'The requested resource was not found',
  },

  // System errors (500)
  RepositoryError: {
    type: 'internal-error',
    title: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    detail: 'An error occurred while processing your request',
  },
};

/**
 * Helper function to sanitize validation errors
 * Prevents leaking sensitive information like password requirements
 */
function sanitizeValidationErrors(details: any[]): any[] {
  if (!details) return [];

  return details.map((detail) => {
    // Don't expose password validation details
    if (detail.path?.includes('password')) {
      return {
        ...detail,
        message: 'Invalid password',
      };
    }
    return detail;
  });
}

/**
 * Helper to create a not found error mapping
 */
export function createNotFoundMapping(resource: string): ErrorMapping {
  const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
  return {
    type: `${resource}-not-found`,
    title: `${resourceName} Not Found`,
    status: HttpStatus.NOT_FOUND,
    extractDetail: (error) => error.message || `${resourceName} not found`,
  };
}

/**
 * Helper to create a duplicate/conflict error mapping
 */
export function createDuplicateMapping(resource: string): ErrorMapping {
  const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
  return {
    type: `duplicate-${resource}`,
    title: 'Conflict',
    status: HttpStatus.CONFLICT,
    extractDetail: (error) => error.message || `${resourceName} already exists`,
  };
}

/**
 * Helper to create a business rule violation mapping
 */
export function createBusinessRuleMapping(
  errorType: string,
  defaultMessage?: string
): ErrorMapping {
  return {
    type: errorType,
    title: 'Unprocessable Entity',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) => error.message || defaultMessage || 'Business rule violation',
  };
}