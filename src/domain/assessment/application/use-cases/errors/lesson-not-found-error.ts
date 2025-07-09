// src/domain/assessment/application/use-cases/errors/lesson-not-found-error.ts
export class LessonNotFoundError extends Error {
  constructor() {
    super('Lesson not found');
  }
}
