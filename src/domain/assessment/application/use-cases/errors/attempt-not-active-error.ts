// src/domain/assessment/application/use-cases/errors/attempt-not-active-error.ts

export class AttemptNotActiveError extends Error {
  constructor() {
    super('Attempt is not active');
    this.name = 'AttemptNotActiveError';
  }
}
