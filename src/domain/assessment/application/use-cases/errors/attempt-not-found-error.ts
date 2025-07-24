// src/domain/assessment/application/use-cases/errors/attempt-not-found-error.ts

export class AttemptNotFoundError extends Error {
  constructor() {
    super('Attempt not found');
    this.name = 'AttemptNotFoundError';
  }
}
