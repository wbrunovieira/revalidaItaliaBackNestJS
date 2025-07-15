// src/domain/assessment/application/repositories/i-attempt-answer-repository.ts
import { Either } from '@/core/either';
import { AttemptAnswer } from '../../enterprise/entities/attempt-answer.entity';

export abstract class IAttemptAnswerRepository {
  abstract create(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>>;
  abstract findById(id: string): Promise<Either<Error, AttemptAnswer>>;
  abstract findByAttemptId(attemptId: string): Promise<Either<Error, AttemptAnswer[]>>;
  abstract findByAttemptIdAndQuestionId(
    attemptId: string,
    questionId: string,
  ): Promise<Either<Error, AttemptAnswer>>;
  abstract findByQuestionId(questionId: string): Promise<Either<Error, AttemptAnswer[]>>;
  abstract update(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  abstract deleteByAttemptId(attemptId: string): Promise<Either<Error, void>>;
  abstract countByAttemptId(attemptId: string): Promise<Either<Error, number>>;
  abstract findByReviewerId(reviewerId: string): Promise<Either<Error, AttemptAnswer[]>>;
  abstract findPendingReviewsByStatus(status?: 'SUBMITTED' | 'GRADING'): Promise<Either<Error, AttemptAnswer[]>>;
}