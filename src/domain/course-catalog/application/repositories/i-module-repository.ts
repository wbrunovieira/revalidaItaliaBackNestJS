// src/domain/course-catalog/application/repositories/i-module-repository.ts
import { Either } from '@/core/either';
import { Module as ModuleEntity } from '@/domain/course-catalog/enterprise/entities/module.entity';

export interface IModuleRepository {
  findByCourseIdAndOrder(
    courseId: string,
    order: number
  ): Promise<Either<Error, ModuleEntity>>;
  create(
    courseId: string,
    module: ModuleEntity
  ): Promise<Either<Error, void>>;
}