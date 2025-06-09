// src/domain/course-catalog/application/use-cases/errors/duplicate-video-error.ts
export class DuplicateVideoError extends Error {
  constructor() {
    super('Video already exists');
    this.name = 'DuplicateVideoError';
  }
}