// src/domain/assessment/application/repositories/i-question-repository.ts
import { Either } from '@/core/either';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { PaginationParams } from '@/core/repositories/pagination-params';

export interface PaginatedQuestionsResult {
  questions: Question[];
  total: number;
}

export abstract class IQuestionRepository {
  abstract findById(id: string): Promise<Either<Error, Question>>;

  abstract findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Question[]>>;

  abstract findByArgumentId(
    argumentId: string,
  ): Promise<Either<Error, Question[]>>;

  abstract findByAssessmentIdAndArgumentId(
    assessmentId: string,
    argumentId: string,
  ): Promise<Either<Error, Question[]>>;

  abstract create(question: Question): Promise<Either<Error, void>>;

  abstract findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, Question[]>>;

  abstract findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedQuestionsResult>>;

  abstract update(question: Question): Promise<Either<Error, void>>;

  abstract delete(id: string): Promise<Either<Error, void>>;

  abstract countByAssessmentId(assessmentId: string): Promise<Either<Error, number>>;

  abstract countByArgumentId(argumentId: string): Promise<Either<Error, number>>;
}