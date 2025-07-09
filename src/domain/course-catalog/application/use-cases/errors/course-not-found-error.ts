// src/domain/course-catalog/application/use-cases/errors/course-not-found-error.ts
export class CourseNotFoundError extends Error {
  constructor() {
    super('Course not found');
    this.name = 'CourseNotFoundError';
  }
}
