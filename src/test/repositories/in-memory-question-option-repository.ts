// src/test/repositories/in-memory-question-option-repository.ts

import { Either, left, right } from '@/core/either';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { IQuestionOptionRepository } from '@/domain/assessment/application/repositories/i-question-option-repository';

export class InMemoryQuestionOptionRepository implements IQuestionOptionRepository {
  public items: QuestionOption[] = [];

  async create(questionOption: QuestionOption): Promise<Either<Error, QuestionOption>> {
    this.items.push(questionOption);
    return right(questionOption);
  }

  async findById(id: string): Promise<Either<Error, QuestionOption>> {
    const questionOption = this.items.find(item => item.id.toString() === id);
    
    if (!questionOption) {
      return left(new Error('Question option not found'));
    }

    return right(questionOption);
  }

  async findByQuestionId(questionId: string): Promise<Either<Error, QuestionOption[]>> {
    const questionOptions = this.items.filter(
      item => item.questionId.toString() === questionId
    );

    return right(questionOptions);
  }

  async update(questionOption: QuestionOption): Promise<Either<Error, QuestionOption>> {
    const itemIndex = this.items.findIndex(
      item => item.id.toString() === questionOption.id.toString()
    );

    if (itemIndex === -1) {
      return left(new Error('Question option not found'));
    }

    this.items[itemIndex] = questionOption;
    return right(questionOption);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex(item => item.id.toString() === id);

    if (itemIndex === -1) {
      return left(new Error('Question option not found'));
    }

    this.items.splice(itemIndex, 1);
    return right(undefined);
  }
}