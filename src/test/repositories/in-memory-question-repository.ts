// src/test/repositories/in-memory-question-repository.ts
import { Either, left, right } from '@/core/either';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import {
  IQuestionRepository,
  PaginatedQuestionsResult,
} from '@/domain/assessment/application/repositories/i-question-repository';
import { PaginationParams } from '@/core/repositories/pagination-params';

export class InMemoryQuestionRepository implements IQuestionRepository {
  public items: Question[] = [];

  async findById(id: string): Promise<Either<Error, Question>> {
    const question = this.items.find((item) => item.id.toString() === id);
    if (!question) {
      return left(new Error('Question not found'));
    }

    return right(question);
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Question[]>> {
    const items = this.items.filter(
      (item) => item.assessmentId.toString() === assessmentId,
    );
    // Sort by createdAt ascending to match Prisma repository behavior
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return right(items);
  }

  async findByArgumentId(
    argumentId: string,
  ): Promise<Either<Error, Question[]>> {
    const items = this.items.filter(
      (item) => item.argumentId?.toString() === argumentId,
    );
    // Sort by createdAt ascending to match Prisma repository behavior
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return right(items);
  }

  async findByAssessmentIdAndArgumentId(
    assessmentId: string,
    argumentId: string,
  ): Promise<Either<Error, Question[]>> {
    const items = this.items.filter(
      (item) =>
        item.assessmentId.toString() === assessmentId &&
        item.argumentId?.toString() === argumentId,
    );
    // Sort by createdAt ascending to match Prisma repository behavior
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return right(items);
  }

  async create(question: Question): Promise<Either<Error, void>> {
    this.items.push(question);
    return right(undefined);
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, Question[]>> {
    let result = [...this.items];

    // Sort by createdAt descending to match Prisma repository behavior
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params) {
      const skip = (params.page - 1) * params.pageSize;
      result = result.slice(skip, skip + params.pageSize);
    }

    return right(result);
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedQuestionsResult>> {
    const result = [...this.items];

    // Sort by createdAt descending to match Prisma repository behavior
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = result.length;
    const questions = result.slice(offset, offset + limit);

    return right({ questions, total });
  }

  async update(question: Question): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === question.id.toString(),
    );

    if (itemIndex === -1) {
      return left(new Error('Question not found'));
    }

    this.items[itemIndex] = question;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex === -1) {
      return left(new Error('Question not found'));
    }

    this.items.splice(itemIndex, 1);
    return right(undefined);
  }

  async countByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, number>> {
    const count = this.items.filter(
      (item) => item.assessmentId.toString() === assessmentId,
    ).length;

    return right(count);
  }

  async countByArgumentId(argumentId: string): Promise<Either<Error, number>> {
    const count = this.items.filter(
      (item) => item.argumentId?.toString() === argumentId,
    ).length;

    return right(count);
  }
}
