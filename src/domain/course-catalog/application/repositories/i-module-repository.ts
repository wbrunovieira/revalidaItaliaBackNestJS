// src/domain/course-catalog/application/repositories/i-module-repository.ts
import { Either } from '@/core/either';
import { Module as ModuleEntity } from '@/domain/course-catalog/enterprise/entities/module.entity';

export  abstract class IModuleRepository {
 
  abstract findByCourseId(
    courseId: string
  ): Promise<Either<Error, ModuleEntity[]>>;

  abstract findByCourseIdAndOrder(
    courseId: string,
    order: number
  ): Promise<Either<Error, ModuleEntity>>;


  abstract create(
    courseId: string,
    module: ModuleEntity
  ): Promise<Either<Error, void>>;

  abstract findById(
    moduleId: string
  ): Promise<Either<Error, ModuleEntity>>;
}