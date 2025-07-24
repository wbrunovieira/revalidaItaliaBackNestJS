// src/domain/assessment/application/use-cases/errors/attempt-expired-error.ts

export class AttemptExpiredError extends Error {
  constructor() {
    super('Attempt has expired');
    this.name = 'AttemptExpiredError';
  }
}
