// src/domain/assessment/application/use-cases/errors/attempt-not-finalized-error.ts

export class AttemptNotFinalizedError extends Error {
  constructor() {
    super('Cannot view results of attempt that is still in progress');
    this.name = 'AttemptNotFinalizedError';
  }
}
