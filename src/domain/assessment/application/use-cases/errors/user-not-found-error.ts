// src/domain/assessment/application/use-cases/errors/user-not-found-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class UserNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}
