// src/domain/assessment/application/repositories/i-answer.repository.ts
import { Either } from '@/core/either';
import { Answer } from '../../enterprise/entities/answer.entity';

export abstract class IAnswerRepository {
  abstract create(answer: Answer): Promise<Either<Error, void>>;
  abstract findById(id: string): Promise<Either<Error, Answer>>;
  abstract findByQuestionId(questionId: string): Promise<Either<Error, Answer>>;
  abstract findManyByQuestionIds(questionIds: string[]): Promise<Either<Error, Answer[]>>;
  abstract update(answer: Answer): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  abstract exists(id: string): Promise<Either<Error, boolean>>;
  abstract existsByQuestionId(questionId: string): Promise<Either<Error, boolean>>;
}