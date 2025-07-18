export class LessonNotFoundError extends Error {
  constructor(lessonId: string) {
    super(`Lesson with ID ${lessonId} not found`)
    this.name = 'LessonNotFoundError'
  }
}