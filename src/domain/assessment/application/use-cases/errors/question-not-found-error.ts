// src/domain/assessment/application/use-cases/errors/question-not-found-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class QuestionNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Question not found');
    this.name = 'QuestionNotFoundError';
  }
}
