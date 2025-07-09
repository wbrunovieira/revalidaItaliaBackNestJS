// src/domain/course-catalog/application/use-cases/errors/duplicate-track-error.ts
export class DuplicateTrackError extends Error {
  constructor() {
    super('Track already exists');
    this.name = 'DuplicateTrackError';
  }
}
