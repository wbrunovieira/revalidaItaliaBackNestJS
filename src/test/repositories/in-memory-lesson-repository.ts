import { Either, left, right } from "@/core/either";
import { ILessonRepository } from "@/domain/course-catalog/application/repositories/i-lesson-repository";
import { Lesson } from "@/domain/course-catalog/enterprise/entities/lesson.entity";

export class InMemoryLessonRepository implements ILessonRepository {
  private byId = new Map<string, Lesson>();
  private byModule = new Map<string, Lesson>();

  async create(lesson: Lesson): Promise<Either<Error, void>> {
    this.byId.set(lesson.id.toString(), lesson);
    this.byModule.set(lesson.moduleId, lesson);
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Lesson>> {
    const lesson = this.byId.get(id);
    if (!lesson) return left(new Error("Lesson not found"));
    return right(lesson);
  }

  async findByModuleId(moduleId: string): Promise<Either<Error, Lesson>> {
    const lesson = this.byModule.get(moduleId);
    if (!lesson) return left(new Error("Lesson not found"));
    return right(lesson);
  }
}