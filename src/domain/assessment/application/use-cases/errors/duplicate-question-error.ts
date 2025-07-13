// src/domain/assessment/application/use-cases/errors/duplicate-question-error.ts

export class DuplicateQuestionError extends Error {
  constructor() {
    super('Question with similar text already exists in this assessment');
    this.name = 'DuplicateQuestionError';
  }
}
