// src/test/repositories/in-memory-attempt-answer-repository.ts
import { Either, left, right } from '@/core/either';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { IAttemptAnswerRepository } from '@/domain/assessment/application/repositories/i-attempt-answer-repository';

export class InMemoryAttemptAnswerRepository implements IAttemptAnswerRepository {
  public items: AttemptAnswer[] = [];

  async create(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>> {
    this.items.push(attemptAnswer);
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, AttemptAnswer>> {
    const attemptAnswer = this.items.find((item) => item.id.toString() === id);
    if (!attemptAnswer) {
      return left(new Error('Attempt answer not found'));
    }

    return right(attemptAnswer);
  }

  async findByAttemptId(attemptId: string): Promise<Either<Error, AttemptAnswer[]>> {
    const attemptAnswers = this.items.filter(
      (item) => item.attemptId === attemptId,
    );

    // Sort by createdAt descending to match Prisma repository behavior
    attemptAnswers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attemptAnswers);
  }

  async findByAttemptIdAndQuestionId(
    attemptId: string,
    questionId: string,
  ): Promise<Either<Error, AttemptAnswer>> {
    const attemptAnswer = this.items.find(
      (item) => item.attemptId === attemptId && item.questionId === questionId,
    );

    if (!attemptAnswer) {
      return left(new Error('Attempt answer not found'));
    }

    return right(attemptAnswer);
  }

  async findByQuestionId(questionId: string): Promise<Either<Error, AttemptAnswer[]>> {
    const attemptAnswers = this.items.filter(
      (item) => item.questionId === questionId,
    );

    // Sort by createdAt descending to match Prisma repository behavior
    attemptAnswers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attemptAnswers);
  }

  async update(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === attemptAnswer.id.toString(),
    );

    if (itemIndex === -1) {
      return left(new Error('Attempt answer not found'));
    }

    this.items[itemIndex] = attemptAnswer;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex === -1) {
      return left(new Error('Attempt answer not found'));
    }

    this.items.splice(itemIndex, 1);
    return right(undefined);
  }

  async deleteByAttemptId(attemptId: string): Promise<Either<Error, void>> {
    this.items = this.items.filter((item) => item.attemptId !== attemptId);
    return right(undefined);
  }

  async countByAttemptId(attemptId: string): Promise<Either<Error, number>> {
    const count = this.items.filter((item) => item.attemptId === attemptId).length;
    return right(count);
  }

  async findByReviewerId(reviewerId: string): Promise<Either<Error, AttemptAnswer[]>> {
    const attemptAnswers = this.items.filter(
      (item) => item.reviewerId === reviewerId,
    );

    // Sort by createdAt descending
    attemptAnswers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attemptAnswers);
  }

  async findPendingReviewsByStatus(status: string = 'SUBMITTED'): Promise<Either<Error, AttemptAnswer[]>> {
    const attemptAnswers = this.items.filter(
      (item) => item.status.getValue() === status && !item.reviewerId,
    );

    // Sort by createdAt ascending (oldest first for review queue)
    attemptAnswers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return right(attemptAnswers);
  }

  // Helper methods for testing
  clear(): void {
    this.items = [];
  }

  getAll(): AttemptAnswer[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }
}