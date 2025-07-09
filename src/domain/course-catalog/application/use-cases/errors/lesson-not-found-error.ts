export class LessonNotFoundError extends Error {
  constructor() {
    super('Lesson not found');
    this.name = 'LessonNotFoundError';
  }
}
