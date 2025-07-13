// src/domain/assessment/application/use-cases/errors/attempt-already-active-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class AttemptAlreadyActiveError extends Error implements UseCaseError {
  constructor() {
    super('User already has an active attempt for this assessment');
    this.name = 'AttemptAlreadyActiveError';
  }
}
