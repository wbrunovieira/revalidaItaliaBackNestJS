// src/domain/course-catalog/domain/exceptions/lesson-not-found.exception.ts
import { EntityNotFoundException } from '@/core/domain/exceptions/entity-not-found.exception';

/**
 * Exception thrown when a lesson is not found
 */
export class LessonNotFoundError extends EntityNotFoundException {
  constructor(message: string = 'Lesson not found') {
    const criteria: Record<string, any> = {};
    
    if (message.includes('id:')) {
      const match = message.match(/id:\s*(\S+)/);
      if (match) criteria.id = match[1];
    }
    
    super('Lesson', criteria);
    this.message = message;
    this._code = 'LESSON.NOT_FOUND';
  }

  static byId(id: string): LessonNotFoundError {
    const error = new LessonNotFoundError(`Lesson not found with id: ${id}`);
    error.context.id = id;
    return error;
  }
}