//src/test/repositories/in-memory-lesson-repository.ts
import { Either, left, right } from '@/core/either';
import {
  ILessonRepository,
  PaginatedLessonsResult,
} from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';

export class InMemoryLessonRepository implements ILessonRepository {
  private byId = new Map<string, Lesson>();
  private byModule = new Map<string, Lesson[]>();

  async create(lesson: Lesson): Promise<Either<Error, undefined>> {
    this.byId.set(lesson.id.toString(), lesson);

    // Store multiple lessons per module
    const existingLessons = this.byModule.get(lesson.moduleId) || [];
    existingLessons.push(lesson);
    this.byModule.set(lesson.moduleId, existingLessons);

    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Lesson>> {
    const lesson = this.byId.get(id);
    if (!lesson) return left(new Error('Lesson not found'));
    return right(lesson);
  }

  async findByModuleId(
    moduleId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedLessonsResult>> {
    const allLessons = this.byModule.get(moduleId) || [];
    const total = allLessons.length;

    // Apply pagination
    const lessons = allLessons.slice(offset, offset + limit);

    return right({ lessons, total });
  }
}
