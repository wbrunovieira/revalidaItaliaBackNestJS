// src/domain/assessment/application/use-cases/errors/answer-not-reviewable-error.ts

export class AnswerNotReviewableError extends Error {
  constructor() {
    super('Answer is not reviewable - must be submitted open answer');
    this.name = 'AnswerNotReviewableError';
  }
}