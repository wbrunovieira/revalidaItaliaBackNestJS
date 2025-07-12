// src/infra/database/prisma/repositories/prisma-argument-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import {
  IArgumentRepository,
  PaginatedArgumentsResult,
} from '@/domain/assessment/application/repositories/i-argument-repository';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { Argument as PrismaArgument } from '@prisma/client';

@Injectable()
export class PrismaArgumentRepository implements IArgumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Either<Error, Argument>> {
    try {
      const data = await this.prisma.argument.findUnique({
        where: { id },
      });

      if (!data) {
        return left(new Error('Argument not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByTitle(title: string): Promise<Either<Error, Argument>> {
    try {
      const data = await this.prisma.argument.findFirst({
        where: { title },
      });

      if (!data) {
        return left(new Error('Argument not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Argument[]>> {
    try {
      const data = await this.prisma.argument.findMany({
        where: { assessmentId },
        orderBy: { createdAt: 'asc' },
      });

      const items = data.map((item) => this.mapToEntity(item));
      return right(items);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async create(argument: Argument): Promise<Either<Error, void>> {
    try {
      await this.prisma.argument.create({
        data: {
          id: argument.id.toString(),
          title: argument.title,
          assessmentId: argument.assessmentId?.toString() || null,
          createdAt: argument.createdAt,
          updatedAt: argument.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Failed to create argument'));
    }
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, Argument[]>> {
    try {
      const data = await this.prisma.argument.findMany({
        skip:
          params?.page && params?.pageSize
            ? (params.page - 1) * params.pageSize
            : undefined,
        take: params?.pageSize,
        orderBy: { createdAt: 'desc' },
      });

      const items = data.map((item) => this.mapToEntity(item));
      return right(items);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedArgumentsResult>> {
    try {
      const [items, total] = await Promise.all([
        this.prisma.argument.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.argument.count(),
      ]);

      const mappedArguments = items.map((item) => this.mapToEntity(item));
      return right({ arguments: mappedArguments, total });
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async update(argument: Argument): Promise<Either<Error, void>> {
    try {
      await this.prisma.argument.update({
        where: { id: argument.id.toString() },
        data: {
          title: argument.title,
          updatedAt: argument.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err.code === 'P2025') {
        return left(new Error('Argument not found'));
      }
      return left(new Error('Failed to update argument'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // First, update questions to remove argument reference
        await tx.question.updateMany({
          where: { argumentId: id },
          data: { argumentId: null },
        });

        // Then delete the argument
        await tx.argument.delete({ where: { id } });
      });

      return right(undefined);
    } catch (err: any) {
      if (err.code === 'P2025') {
        return left(new Error('Argument not found'));
      }
      return left(new Error('Failed to delete argument'));
    }
  }

  async findByTitleAndAssessmentId(
    title: string,
    assessmentId: string,
  ): Promise<Either<Error, Argument>> {
    try {
      const data = await this.prisma.argument.findFirst({
        where: {
          title,
          assessmentId,
        },
      });

      if (!data) {
        return left(new Error('Argument not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  private mapToEntity(data: PrismaArgument): Argument {
    const props = {
      title: data.title,
      assessmentId: data.assessmentId
        ? new UniqueEntityID(data.assessmentId)
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Argument.reconstruct(props, new UniqueEntityID(data.id));
  }
}
