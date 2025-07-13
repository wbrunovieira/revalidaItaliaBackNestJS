// src/domain/assessment/application/use-cases/errors/answer-already-exists-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class AnswerAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('Answer already exists for this question');
    this.name = 'AnswerAlreadyExistsError';
  }
}
