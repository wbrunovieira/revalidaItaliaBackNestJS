// src/domain/auth/application/use-cases/errors/duplicate-national-id-error.ts
export class DuplicateNationalIdError extends Error {
  constructor() {
    super('National ID already exists');
    this.name = 'DuplicateNationalIdError';
  }
}
