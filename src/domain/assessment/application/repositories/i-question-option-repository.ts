// src/domain/assessment/application/repositories/i-question-option-repository.ts

import { Either } from '@/core/either';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';

export interface IQuestionOptionRepository {
  create(
    questionOption: QuestionOption,
  ): Promise<Either<Error, QuestionOption>>;
  findById(id: string): Promise<Either<Error, QuestionOption>>;
  findByQuestionId(
    questionId: string,
  ): Promise<Either<Error, QuestionOption[]>>;
  findByQuestionIds(
    questionIds: string[],
  ): Promise<Either<Error, QuestionOption[]>>;
  update(
    questionOption: QuestionOption,
  ): Promise<Either<Error, QuestionOption>>;
  delete(id: string): Promise<Either<Error, void>>;
}
