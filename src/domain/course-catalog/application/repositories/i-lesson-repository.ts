// src/domain/course-catalog/application/repositories/i-lesson-repository.ts
import { Either } from '@/core/either';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';

export interface PaginatedLessonsResult {
  lessons: Lesson[];
  total: number;
}

export abstract class ILessonRepository {
  /**
   * Finds a single Lesson by its ID.
   */
  abstract findById(id: string): Promise<Either<Error, Lesson>>;

  /**
   * Finds lessons by module ID with pagination support.
   */
  abstract findByModuleId(
    moduleId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedLessonsResult>>;

  /**
   * Persists a new Lesson.
   */
  abstract create(lesson: Lesson): Promise<Either<Error, undefined>>;
}
