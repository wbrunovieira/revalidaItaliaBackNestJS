// src/domain/course-catalog/application/use-cases/errors/invalid-file-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidFileError extends Error implements UseCaseError {
  constructor(message: string) {
    super(`Invalid file: ${message}`);
  }
}
