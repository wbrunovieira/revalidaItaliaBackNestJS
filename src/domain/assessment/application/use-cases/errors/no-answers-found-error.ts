// src/domain/assessment/application/use-cases/errors/no-answers-found-error.ts

export class NoAnswersFoundError extends Error {
  constructor() {
    super('No answers found for this attempt');
    this.name = 'NoAnswersFoundError';
  }
}
