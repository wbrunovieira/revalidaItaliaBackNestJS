import { ApiOperationOptions, ApiResponseOptions, ApiBodyOptions } from '@nestjs/swagger';
import { CreateAccountDto } from '@/domain/auth/application/dtos/create-student.dto';
import { CreateAccountResponseDto } from '@/domain/auth/application/dtos/student-response.dto';
import { 
  BaseValidationErrorDoc, 
  BaseConflictErrorDoc,
  UnauthorizedResponseDoc,
  ForbiddenResponseDoc,
  InternalServerErrorDoc
} from '../shared/error-responses.docs';

export const CreateAccountOperation: ApiOperationOptions = {
  summary: 'Create new user account',
  description: `Creates a user account (student, tutor, or admin) for the revalidation system. 
  Requires admin authentication. Email and document must be unique.`,
};

export const CreateAccountBody: ApiBodyOptions = {
  type: CreateAccountDto,
  description: 'User account data',
  examples: {
    student: {
      summary: 'Student account',
      value: {
        name: 'Giulia Bianchi',
        email: 'giulia.bianchi@medicina.it',
        password: 'SecurePass123!',
        cpf: '12345678901',
        role: 'student',
      },
    },
    tutor: {
      summary: 'Tutor account',
      value: {
        name: 'Dr. Marco Rossi',
        email: 'marco.rossi@portalrevalida.com',
        password: 'SecurePass123!',
        cpf: 'RSSMRA85M01',
        role: 'tutor',
      },
    },
    admin: {
      summary: 'Admin account',
      value: {
        name: 'Admin Silva',
        email: 'admin@portalrevalida.com',
        password: 'AdminPass123!',
        cpf: 'ADM-2024-001',
        role: 'admin',
      },
    },
  },
};

export const CreateAccountSuccessResponse: ApiResponseOptions = {
  status: 201,
  description: 'User account created successfully',
  type: CreateAccountResponseDto,
};

// Specific validation errors for create student
export const CreateAccountValidationError: ApiResponseOptions = {
  ...BaseValidationErrorDoc,
  examples: {
    multipleErrors: {
      summary: 'Multiple validation errors',
      value: {
        type: 'https://api.portalrevalida.com/errors/validation-failed',
        title: 'Validation Failed',
        status: 400,
        detail: 'One or more fields failed validation',
        errors: {
          name: ['Name must be at least 3 characters'],
          cpf: ['Document must have at least 5 characters'],
          password: ['Password must contain at least one uppercase letter'],
        }
      }
    }
  }
};

// Specific conflict errors for create student
export const CreateAccountConflictError: ApiResponseOptions = {
  ...BaseConflictErrorDoc,
  examples: {
    emailConflict: {
      summary: 'Email already exists',
      value: {
        type: 'https://api.portalrevalida.com/errors/duplicate-email',
        title: 'Duplicate Email',
        status: 409,
        detail: 'Email already registered in the system',
      }
    },
    documentConflict: {
      summary: 'Document already exists',
      value: {
        type: 'https://api.portalrevalida.com/errors/duplicate-cpf',
        title: 'Duplicate Document',
        status: 409,
        detail: 'CPF already registered in the system',
      }
    }
  }
};

// Admin-specific forbidden message
export const CreateAccountForbiddenError: ApiResponseOptions = {
  ...ForbiddenResponseDoc,
  description: 'Only administrators can create user accounts',
};

// All responses for create student endpoint
export const CreateAccountResponses = {
  201: CreateAccountSuccessResponse,
  400: CreateAccountValidationError,
  401: UnauthorizedResponseDoc,
  403: CreateAccountForbiddenError,
  409: CreateAccountConflictError,
  500: InternalServerErrorDoc,
};