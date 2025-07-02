// src/test/repositories/in-memory-module-repository.ts
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import {
  ModuleDependencyInfo,
  ModuleDependency,
} from '@/domain/course-catalog/application/dtos/module-dependencies.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';

interface StoredModule {
  module: Module;
  courseId: string;
  // Simulação de dependências para testes
  lessons?: any[];
  videos?: any[];
}

export class InMemoryModuleRepository implements IModuleRepository {
  public items: StoredModule[] = [];

  async findByCourseId(courseId: string): Promise<Either<Error, Module[]>> {
    try {
      const matches = this.items
        .filter((entry) => entry.courseId === courseId)
        .map((entry) => entry.module);
      return right(matches);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async findByCourseIdAndOrder(
    courseId: string,
    order: number,
  ): Promise<Either<Error, Module>> {
    const found = this.items.find(
      (entry) => entry.courseId === courseId && entry.module.order === order,
    );
    return found ? right(found.module) : left(new Error('Module not found'));
  }

  async create(courseId: string, module: Module): Promise<Either<Error, void>> {
    this.items.push({ module, courseId });
    return right(undefined);
  }

  async findById(moduleId: string): Promise<Either<Error, Module>> {
    const found = this.items.find((e) => e.module.id.toString() === moduleId);
    return found ? right(found.module) : left(new Error('Module not found'));
  }

  async checkModuleDependencies(
    moduleId: string,
  ): Promise<Either<Error, ModuleDependencyInfo>> {
    try {
      const found = this.items.find((e) => e.module.id.toString() === moduleId);

      if (!found) {
        return left(new Error('Module not found'));
      }

      const lessons = found.lessons || [];
      const videos = found.videos || [];

      const dependencies: ModuleDependency[] = [];

      // Adicionar lições como dependências
      lessons.forEach((lesson) => {
        dependencies.push({
          type: 'lesson' as const,
          id: lesson.id || new UniqueEntityID().toString(),
          name: lesson.title || `Lesson ${lesson.id}`,
          relatedEntities: {
            videos: lesson.videos?.length || 0,
            documents: lesson.documents?.length || 0,
            flashcards: lesson.flashcards?.length || 0,
            quizzes: lesson.quizzes?.length || 0,
          },
        });
      });

      // Adicionar vídeos diretos do módulo como dependências (se houver)
      videos.forEach((video) => {
        dependencies.push({
          type: 'video' as const,
          id: video.id || new UniqueEntityID().toString(),
          name: video.title || `Video ${video.id}`,
        });
      });

      const canDelete = dependencies.length === 0;

      return right({
        canDelete,
        totalDependencies: dependencies.length,
        summary: {
          lessons: lessons.length,
          videos: videos.length,
        },
        dependencies,
      });
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async delete(moduleId: string): Promise<Either<Error, void>> {
    try {
      const index = this.items.findIndex(
        (e) => e.module.id.toString() === moduleId,
      );

      if (index === -1) {
        return left(new Error('Module not found'));
      }

      this.items.splice(index, 1);
      return right(undefined);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  // Método auxiliar para testes - adicionar dependências simuladas
  public addDependenciesToModule(
    moduleId: string,
    dependencies: { lessons?: any[]; videos?: any[] },
  ): void {
    const found = this.items.find((e) => e.module.id.toString() === moduleId);
    if (found) {
      if (dependencies.lessons) {
        found.lessons = dependencies.lessons;
      }
      if (dependencies.videos) {
        found.videos = dependencies.videos;
      }
    }
  }
}
