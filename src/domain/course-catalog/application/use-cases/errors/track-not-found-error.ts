// src/domain/course-catalog/application/use-cases/errors/track-not-found-error.ts
export class TrackNotFoundError extends Error {
  constructor() {
    super('Track not found');
    this.name = 'TrackNotFoundError';
  }
}
