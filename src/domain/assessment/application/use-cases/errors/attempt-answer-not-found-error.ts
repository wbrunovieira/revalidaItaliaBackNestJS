// src/domain/assessment/application/use-cases/errors/attempt-answer-not-found-error.ts

export class AttemptAnswerNotFoundError extends Error {
  constructor() {
    super('Attempt answer not found');
    this.name = 'AttemptAnswerNotFoundError';
  }
}
