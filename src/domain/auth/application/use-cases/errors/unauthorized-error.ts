// src/domain/auth/application/use-cases/errors/unauthorized-error.ts
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
