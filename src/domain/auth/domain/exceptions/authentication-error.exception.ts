// src/domain/auth/domain/exceptions/authentication-error.exception.ts
import { BusinessRuleException } from '@/core/domain/exceptions';

/**
 * Exception thrown when authentication fails
 *
 * Used when credentials are invalid or authentication process fails
 */
export class AuthenticationError extends BusinessRuleException {
  constructor(message: string = 'Invalid credentials') {
    super(message, 'AUTH.AUTHENTICATION_FAILED', {
      reason: 'Invalid credentials provided',
      suggestion: 'Please check your email and password',
    });
  }

  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError('Invalid credentials');
  }

  static accountLocked(): AuthenticationError {
    const error = new AuthenticationError('Account is locked');
    error._code = 'AUTH.ACCOUNT_LOCKED';
    return error;
  }

  static accountNotVerified(): AuthenticationError {
    const error = new AuthenticationError('Account not verified');
    error._code = 'AUTH.ACCOUNT_NOT_VERIFIED';
    return error;
  }

  static emailNotVerified(): AuthenticationError {
    const error = new AuthenticationError('Email not verified');
    error._code = 'AUTH.EMAIL_NOT_VERIFIED';
    return error;
  }

  static profileNotFound(): AuthenticationError {
    const error = new AuthenticationError('User profile not found');
    error._code = 'AUTH.PROFILE_NOT_FOUND';
    return error;
  }

  static authorizationNotFound(): AuthenticationError {
    const error = new AuthenticationError('User authorization not found');
    error._code = 'AUTH.AUTHORIZATION_NOT_FOUND';
    return error;
  }

  static authorizationExpired(): AuthenticationError {
    const error = new AuthenticationError('User authorization has expired');
    error._code = 'AUTH.AUTHORIZATION_EXPIRED';
    return error;
  }
}
