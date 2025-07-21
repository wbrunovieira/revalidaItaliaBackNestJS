// src/domain/auth/application/use-cases/errors/index.ts

/**
 * DEPRECATED: These error classes are being migrated to domain exceptions.
 * 
 * This file provides backward compatibility by re-exporting domain exceptions
 * with their old names. This will be removed in a future version.
 * 
 * Please import from '@/domain/auth/domain/exceptions' instead.
 */

export { 
  AuthenticationError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  InvalidInputError,
  RepositoryError,
  ResourceNotFoundError,
  UnauthorizedError
} from '@/domain/auth/domain/exceptions';