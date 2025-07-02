// src/domain/course-catalog/application/repositories/i-module-repository.ts
import { Either } from '@/core/either';
import { Module as ModuleEntity } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { ModuleDependencyInfo } from '../dtos/module-dependencies.dto';

export abstract class IModuleRepository {
  abstract findByCourseId(
    courseId: string,
  ): Promise<Either<Error, ModuleEntity[]>>;

  abstract findByCourseIdAndOrder(
    courseId: string,
    order: number,
  ): Promise<Either<Error, ModuleEntity>>;

  abstract create(
    courseId: string,
    module: ModuleEntity,
  ): Promise<Either<Error, void>>;

  abstract findById(moduleId: string): Promise<Either<Error, ModuleEntity>>;

  abstract checkModuleDependencies(
    moduleId: string,
  ): Promise<Either<Error, ModuleDependencyInfo>>;

  abstract delete(moduleId: string): Promise<Either<Error, void>>;

  abstract findBySlug(
    slug: string,
  ): Promise<Either<Error, ModuleEntity | null>>;

  abstract update(module: ModuleEntity): Promise<Either<Error, void>>;

  abstract findCourseIdByModuleId(
    moduleId: string,
  ): Promise<Either<Error, string>>;
}
