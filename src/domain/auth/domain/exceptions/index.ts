// src/domain/auth/domain/exceptions/index.ts

// Re-export core exceptions for convenience
export * from '@/core/domain/exceptions';

// Export auth-specific exceptions
export * from './duplicate-email.exception';
export * from './duplicate-national-id.exception';
export * from './weak-password.exception';
export * from './invalid-email-format.exception';
export * from './user-not-found.exception';
export * from './authentication-error.exception';
export * from './invalid-input-error.exception';
export * from './repository-error.exception';
export * from './unauthorized-error.exception';
export * from './resource-not-found-error.exception';