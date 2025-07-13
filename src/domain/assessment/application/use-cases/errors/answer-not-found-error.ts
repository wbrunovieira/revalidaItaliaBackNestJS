// src/domain/assessment/application/use-cases/errors/answer-not-found-error.ts

export class AnswerNotFoundError extends Error {
  constructor() {
    super('Answer not found');
    this.name = 'AnswerNotFoundError';
  }
}