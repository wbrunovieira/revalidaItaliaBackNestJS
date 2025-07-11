// src/test/repositories/in-memory-argument-repository.ts
import { Either, left, right } from '@/core/either';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import {
  IArgumentRepository,
  PaginatedArgumentsResult,
} from '@/domain/assessment/application/repositories/i-argument-repository';
import { PaginationParams } from '@/core/repositories/pagination-params';

export class InMemoryArgumentRepository implements IArgumentRepository {
  public items: Argument[] = [];

  async findById(id: string): Promise<Either<Error, Argument>> {
    const argument = this.items.find((item) => item.id.toString() === id);
    if (!argument) {
      return left(new Error('Argument not found'));
    }

    return right(argument);
  }

  async findByTitle(title: string): Promise<Either<Error, Argument>> {
    const argument = this.items.find((item) => item.title === title);
    if (!argument) {
      return left(new Error('Argument not found'));
    }
    return right(argument);
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Argument[]>> {
    const items = this.items.filter(
      (item) => item.assessmentId?.toString() === assessmentId,
    );
    // Sort by createdAt ascending to match Prisma repository behavior
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return right(items);
  }

  async create(argument: Argument): Promise<Either<Error, void>> {
    this.items.push(argument);
    return right(undefined);
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, Argument[]>> {
    let result = [...this.items];

    // Sort by createdAt descending to match Prisma repository behavior
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params?.page && params?.pageSize) {
      const skip = (params.page - 1) * params.pageSize;
      result = result.slice(skip, skip + params.pageSize);
    }

    return right(result);
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedArgumentsResult>> {
    const sortedItems = [...this.items].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const items = sortedItems.slice(offset, offset + limit);
    const total = this.items.length;
    return right({ arguments: items, total });
  }

  async update(argument: Argument): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.equals(argument.id));
    if (index === -1) {
      return left(new Error('Argument not found'));
    }
    this.items[index] = argument;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.toString() === id);
    if (index === -1) {
      return left(new Error('Argument not found'));
    }
    this.items.splice(index, 1);
    return right(undefined);
  }

  async findByTitleAndAssessmentId(
    title: string,
    assessmentId: string,
  ): Promise<Either<Error, Argument>> {
    const argument = this.items.find(
      (item) =>
        item.title === title && item.assessmentId?.toString() === assessmentId,
    );
    if (!argument) {
      return left(new Error('Argument not found'));
    }
    return right(argument);
  }
}
