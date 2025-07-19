import { ApiResponseOptions } from '@nestjs/swagger';
import { 
  ErrorResponseDto, 
  ValidationErrorResponseDto, 
  ConflictErrorResponseDto 
} from '@/domain/auth/application/dtos/error-response.dto';

/**
 * Generic error responses that can be reused across multiple endpoints
 */

export const UnauthorizedResponseDoc: ApiResponseOptions = {
  status: 401,
  description: 'Authentication required - missing or invalid token',
  type: ErrorResponseDto,
};

export const ForbiddenResponseDoc: ApiResponseOptions = {
  status: 403,
  description: 'Insufficient permissions',
  type: ErrorResponseDto,
};

export const InternalServerErrorDoc: ApiResponseOptions = {
  status: 500,
  description: 'Internal server error',
  type: ErrorResponseDto,
};

// Base validation error without specific examples
export const BaseValidationErrorDoc: ApiResponseOptions = {
  status: 400,
  description: 'Validation error - invalid input data',
  type: ValidationErrorResponseDto,
};

// Base conflict error without specific examples
export const BaseConflictErrorDoc: ApiResponseOptions = {
  status: 409,
  description: 'Conflict - resource already exists',
  type: ConflictErrorResponseDto,
};