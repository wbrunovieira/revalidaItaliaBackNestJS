// src/domain/assessment/application/use-cases/errors/insufficient-permissions-error.ts

export class InsufficientPermissionsError extends Error {
  constructor() {
    super('User does not have permission to review answers');
    this.name = 'InsufficientPermissionsError';
  }
}
