// src/domain/course-catalog/application/use-cases/errors/duplicate-lesson-order-error.ts

export class DuplicateLessonOrderError extends Error {
  constructor() {
    super('A lesson with this order already exists in the module');
    this.name = 'DuplicateLessonOrderError';
  }
}
