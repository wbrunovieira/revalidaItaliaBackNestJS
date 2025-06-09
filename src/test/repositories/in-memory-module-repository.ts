// src/test/repositories/in-memory-module-repository.ts
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

interface StoredModule {
  module: Module;
  courseId: string;
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
    order: number
  ): Promise<Either<Error, Module>> {
    const found = this.items.find(
      (entry) => entry.courseId === courseId && entry.module.order === order
    );
    return found
      ? right(found.module)
      : left(new Error('Module not found'));
  }

  async create(courseId: string, module: Module): Promise<Either<Error, void>> {
    this.items.push({ module, courseId });
    return right(undefined);
  }
  async findById(moduleId: string): Promise<Either<Error, Module>> {
    const found = this.items.find((e) => e.module.id.toString() === moduleId);
    return found ? right(found.module) : left(new Error("Module not found"));
  }
}