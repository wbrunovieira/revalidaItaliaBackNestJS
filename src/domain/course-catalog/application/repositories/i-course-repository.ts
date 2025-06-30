// src/domain/course-catalog/application/repositories/i-course-repository.ts
import { Either } from '@/core/either';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { CourseDependencyInfo } from '../dtos/course-dependencies.dto';

export abstract class ICourseRepository {
  abstract findById(id: string): Promise<Either<Error, Course>>;

  abstract findByTitle(title: string): Promise<Either<Error, Course>>;

  abstract create(course: Course): Promise<Either<Error, void>>;

  abstract findAll(): Promise<Either<Error, Course[]>>;

  // Atualizar um curso existente
  abstract update(course: Course): Promise<Either<Error, void>>;

  // Verificar se slug já existe (excluindo o curso atual)
  abstract findBySlugExcludingId(
    slug: string,
    excludeId: string,
  ): Promise<Either<Error, Course>>;

  // Verificar se título já existe (excluindo o curso atual)
  abstract findByTitleExcludingId(
    title: string,
    excludeId: string,
  ): Promise<Either<Error, Course>>;

  abstract delete(id: string): Promise<Either<Error, void>>;

  abstract checkCourseDependencies(
    courseId: string,
  ): Promise<Either<Error, CourseDependencyInfo>>;
}
