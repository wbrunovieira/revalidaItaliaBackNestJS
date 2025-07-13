// src/test/repositories/in-memory-answer-repository.ts
import { Either, left, right } from '@/core/either';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { IAnswerRepository, PaginatedAnswersResult } from '@/domain/assessment/application/repositories/i-answer.repository';

export class InMemoryAnswerRepository implements IAnswerRepository {
  public items: Answer[] = [];

  async create(answer: Answer): Promise<Either<Error, void>> {
    this.items.push(answer);
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Answer>> {
    const answer = this.items.find((item) => item.id.toString() === id);
    if (!answer) {
      return left(new Error('Answer not found'));
    }

    return right(answer);
  }

  async findByQuestionId(questionId: string): Promise<Either<Error, Answer>> {
    const answer = this.items.find(
      (item) => item.questionId.toString() === questionId,
    );
    if (!answer) {
      return left(new Error('Answer not found'));
    }

    return right(answer);
  }

  async findManyByQuestionIds(
    questionIds: string[],
  ): Promise<Either<Error, Answer[]>> {
    const answers = this.items.filter((item) =>
      questionIds.includes(item.questionId.toString()),
    );

    // Sort by createdAt ascending to match Prisma repository behavior
    answers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return right(answers);
  }

  async findAllPaginated(
    limit: number,
    offset: number,
    questionId?: string,
  ): Promise<Either<Error, PaginatedAnswersResult>> {
    let filteredItems = [...this.items];

    // Filter by questionId if provided
    if (questionId) {
      filteredItems = filteredItems.filter(
        (item) => item.questionId.toString() === questionId,
      );
    }

    // Sort by createdAt descending (most recent first)
    filteredItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    return right({
      answers: paginatedItems,
      total,
    });
  }

  async update(answer: Answer): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === answer.id.toString(),
    );

    if (itemIndex === -1) {
      return left(new Error('Answer not found'));
    }

    this.items[itemIndex] = answer;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex === -1) {
      return left(new Error('Answer not found'));
    }

    this.items.splice(itemIndex, 1);
    return right(undefined);
  }

  async exists(id: string): Promise<Either<Error, boolean>> {
    const exists = this.items.some((item) => item.id.toString() === id);
    return right(exists);
  }

  async existsByQuestionId(
    questionId: string,
  ): Promise<Either<Error, boolean>> {
    const exists = this.items.some(
      (item) => item.questionId.toString() === questionId,
    );
    return right(exists);
  }

  // Helper methods for testing
  clear(): void {
    this.items = [];
  }

  getAll(): Answer[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }
}
