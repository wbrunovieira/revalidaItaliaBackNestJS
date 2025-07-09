// src/domain/course-catalog/application/use-cases/errors/duplicate-course-error.ts
export class DuplicateCourseError extends Error {
  constructor() {
    super('Course with this title already exists');
  }
}
