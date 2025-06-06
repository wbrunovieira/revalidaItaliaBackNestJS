// test/repositories/in-memory-module-repository.ts
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';

interface StoredModule {
  courseId: string;
  module: Module;
}

export class InMemoryModuleRepository implements IModuleRepository {
  public items: StoredModule[] = [];

  async findByCourseIdAndOrder(
    courseId: string,
    order: number
  ): Promise<Either<Error, Module>> {
    const found = this.items.find(
      (item) => item.courseId === courseId && item.module.order === order
    );
    if (found) {
      return right(found.module);
    }
    return left(new Error('Not found'));
  }

  async create(
    courseId: string,
    module: Module
  ): Promise<Either<Error, void>> {
    this.items.push({ courseId, module });
    return right(undefined);
  }
}