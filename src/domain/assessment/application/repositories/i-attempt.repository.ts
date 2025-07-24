// src/domain/assessment/application/repositories/i-attempt.repository.ts
import { Either } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { Attempt } from '../../enterprise/entities/attempt.entity';

export interface ListAttemptsFilters {
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  identityId?: string;
  assessmentId?: string;
}

export abstract class IAttemptRepository {
  abstract create(attempt: Attempt): Promise<Either<Error, void>>;
  abstract findById(id: string): Promise<Either<Error, Attempt>>;
  abstract findByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>>;
  abstract findActiveByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt>>;
  abstract findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, Attempt[]>>;
  abstract findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>>;
  abstract update(attempt: Attempt): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  abstract countByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, number>>;
  abstract findWithFilters(
    filters: ListAttemptsFilters,
    pagination?: PaginationParams,
  ): Promise<Either<Error, Attempt[]>>;
}
