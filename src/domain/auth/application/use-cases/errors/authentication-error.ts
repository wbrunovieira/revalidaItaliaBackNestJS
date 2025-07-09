// src/domain/auth/application/use-cases/errors/authentication-error.ts
export class AuthenticationError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
