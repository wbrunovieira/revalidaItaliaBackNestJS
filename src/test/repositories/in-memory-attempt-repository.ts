// src/test/repositories/in-memory-attempt-repository.ts
import { Either, left, right } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import {
  IAttemptRepository,
  ListAttemptsFilters,
} from '@/domain/assessment/application/repositories/i-attempt.repository';

export class InMemoryAttemptRepository implements IAttemptRepository {
  public items: Attempt[] = [];

  async create(attempt: Attempt): Promise<Either<Error, void>> {
    this.items.push(attempt);
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Attempt>> {
    const attempt = this.items.find((item) => item.id.toString() === id);
    if (!attempt) {
      return left(new Error('Attempt not found'));
    }

    return right(attempt);
  }

  async findByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>> {
    const attempts = this.items.filter(
      (item) =>
        item.identityId === identityId && item.assessmentId === assessmentId,
    );

    // Sort by createdAt descending to match Prisma repository behavior
    attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attempts);
  }

  async findActiveByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt>> {
    const attempt = this.items.find(
      (item) =>
        item.identityId === identityId &&
        item.assessmentId === assessmentId &&
        item.status.isInProgress(),
    );

    if (!attempt) {
      return left(new Error('Active attempt not found'));
    }

    return right(attempt);
  }

  async findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, Attempt[]>> {
    const attempts = this.items.filter(
      (item) => item.identityId === identityId,
    );

    // Sort by createdAt descending to match Prisma repository behavior
    attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attempts);
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>> {
    const attempts = this.items.filter(
      (item) => item.assessmentId === assessmentId,
    );

    // Sort by createdAt descending to match Prisma repository behavior
    attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(attempts);
  }

  async update(attempt: Attempt): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === attempt.id.toString(),
    );

    if (itemIndex === -1) {
      return left(new Error('Attempt not found'));
    }

    this.items[itemIndex] = attempt;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex === -1) {
      return left(new Error('Attempt not found'));
    }

    this.items.splice(itemIndex, 1);
    return right(undefined);
  }

  async countByIdentityAndAssessment(
    identityId: string,
    assessmentId: string,
  ): Promise<Either<Error, number>> {
    const count = this.items.filter(
      (item) =>
        item.identityId === identityId && item.assessmentId === assessmentId,
    ).length;

    return right(count);
  }

  async findWithFilters(
    filters: ListAttemptsFilters,
    pagination?: PaginationParams,
  ): Promise<Either<Error, Attempt[]>> {
    let filteredItems = [...this.items];

    // Apply filters
    if (filters.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status.getValue() === filters.status,
      );
    }

    if (filters.identityId) {
      filteredItems = filteredItems.filter(
        (item) => item.identityId === filters.identityId,
      );
    }

    if (filters.assessmentId) {
      filteredItems = filteredItems.filter(
        (item) => item.assessmentId === filters.assessmentId,
      );
    }

    // Sort by createdAt descending
    filteredItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    if (pagination) {
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      filteredItems = filteredItems.slice(startIndex, endIndex);
    }

    return right(filteredItems);
  }

  // Helper methods for testing
  clear(): void {
    this.items = [];
  }

  getAll(): Attempt[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }
}
