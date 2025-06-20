// src/domain/course-catalog/application/use-cases/errors/duplicate-document-error.ts
import { UseCaseError } from '@/core/errors/use-case-error';

export class DuplicateDocumentError extends Error implements UseCaseError {
  constructor() {
    super('Document with this filename already exists');
  }
}
