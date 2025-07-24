// src/infra/filters/error-mappings/user.mappings.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorMapping } from './shared.mappings';

/**
 * Error mappings specific to the User module
 * Handles authentication and user-related errors
 */
export const userErrorMappings: Record<string, ErrorMapping> = {
  // Authentication errors (401)
  AuthenticationError: {
    type: 'authentication-failed',
    title: 'Authentication Failed',
    status: HttpStatus.UNAUTHORIZED,
    detail: 'Invalid credentials',
  },

  // Authorization errors (403)
  UnauthorizedError: {
    type: 'forbidden',
    title: 'Forbidden',
    status: HttpStatus.FORBIDDEN,
    extractDetail: (error) =>
      error.message || 'You do not have permission to perform this action',
  },

  // Duplicate errors (409)
  DuplicateEmailError: {
    type: 'duplicate-email',
    title: 'Duplicate Email',
    status: HttpStatus.CONFLICT,
    detail: 'Email already registered in the system',
  },

  DuplicateNationalIdError: {
    type: 'duplicate-national-id',
    title: 'Duplicate Document',
    status: HttpStatus.CONFLICT,
    detail: 'National ID already registered in the system',
  },
};
