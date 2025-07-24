// src/domain/course-catalog/domain/exceptions/invalid-file.exception.ts
import { DomainException } from '@/core/domain/exceptions/domain.exception';

/**
 * Exception thrown when a file is invalid (format, size, etc.)
 */
export class InvalidFileError extends DomainException {
  constructor(reason: string, filename?: string) {
    const message = `Invalid file${filename ? ` '${filename}'` : ''}: ${reason}`;
    const code = 'DOCUMENT.INVALID_FILE';

    super(message, code, { reason, filename });
  }

  static unsupportedFormat(filename: string, format: string): InvalidFileError {
    return new InvalidFileError(`Unsupported format '${format}'`, filename);
  }

  static exceedsMaxSize(filename: string, maxSize: string): InvalidFileError {
    return new InvalidFileError(
      `File exceeds maximum size of ${maxSize}`,
      filename,
    );
  }

  static corrupted(filename: string): InvalidFileError {
    return new InvalidFileError('File is corrupted or unreadable', filename);
  }
}
