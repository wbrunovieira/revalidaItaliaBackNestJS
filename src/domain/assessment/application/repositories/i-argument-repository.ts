// src/domain/assessment/application/repositories/i-argument-repository.ts
import { Either } from '@/core/either';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { PaginationParams } from '@/core/repositories/pagination-params';

export interface PaginatedArgumentsResult {
  arguments: Argument[];
  total: number;
}

export abstract class IArgumentRepository {
  abstract findById(id: string): Promise<Either<Error, Argument>>;

  abstract findByTitle(title: string): Promise<Either<Error, Argument>>;

  abstract findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Argument[]>>;

  abstract create(argument: Argument): Promise<Either<Error, void>>;

  abstract findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, Argument[]>>;

  abstract findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedArgumentsResult>>;

  abstract update(argument: Argument): Promise<Either<Error, void>>;

  abstract delete(id: string): Promise<Either<Error, void>>;

  abstract findByTitleAndAssessmentId(
    title: string,
    assessmentId: string,
  ): Promise<Either<Error, Argument>>;
}
