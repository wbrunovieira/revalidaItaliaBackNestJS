// src/domain/assessment/application/repositories/i-assessment-repository.ts
import { Either } from '@/core/either';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { PaginationParams } from '@/core/repositories/pagination-params';

export abstract class IAssessmentRepository {
  abstract findById(id: string): Promise<Either<Error, Assessment>>;

  abstract findByTitle(title: string): Promise<Either<Error, Assessment>>;

  abstract findByLessonId(
    lessonId: string,
  ): Promise<Either<Error, Assessment[]>>;

  abstract create(assessment: Assessment): Promise<Either<Error, void>>;

  abstract findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, Assessment[]>>;

  abstract update(assessment: Assessment): Promise<Either<Error, void>>;

  abstract delete(id: string): Promise<Either<Error, void>>;

  abstract findByTitleExcludingId(
    title: string,
    excludeId: string,
  ): Promise<Either<Error, Assessment>>;
}
