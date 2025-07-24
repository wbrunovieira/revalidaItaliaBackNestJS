// src/domain/course-catalog/domain/exceptions/duplicate-document.exception.ts
import { DomainException } from '@/core/domain/exceptions/domain.exception';

/**
 * Exception thrown when trying to create a document with a duplicate filename
 */
export class DuplicateDocumentError extends DomainException {
  constructor(filename: string) {
    const message = `Document with filename '${filename}' already exists`;
    const code = 'DOCUMENT.DUPLICATE_FILENAME';
    
    super(message, code, { filename });
  }
}