// src/domain/assessment/application/use-cases/errors/invalid-answer-type-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidAnswerTypeError extends Error implements UseCaseError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAnswerTypeError';
  }
}
