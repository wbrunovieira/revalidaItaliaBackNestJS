// src/infra/database/prisma/repositories/prisma-attempt-repository.ts
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';

import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { ScoreVO } from '@/domain/assessment/enterprise/value-objects/score.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { IAttemptRepository } from '@/domain/assessment/application/repositories/i-attempt.repository';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaAttemptRepository implements IAttemptRepository {
  constructor(private prisma: PrismaService) {}

  async create(attempt: Attempt): Promise<Either<Error, void>> {
    try {
      await this.prisma.attempt.create({
        data: {
          id: attempt.id.toString(),
          status: attempt.status.getValue(),
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          timeLimitExpiresAt: attempt.timeLimitExpiresAt,
          userId: attempt.userId,
          assessmentId: attempt.assessmentId,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findById(id: string): Promise<Either<Error, Attempt>> {
    try {
      const attempt = await this.prisma.attempt.findUnique({
        where: { id },
      });

      if (!attempt) {
        return left(new Error('Attempt not found'));
      }

      return right(this.toDomain(attempt));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByUserAndAssessment(
    userId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>> {
    try {
      const attempts = await this.prisma.attempt.findMany({
        where: {
          userId,
          assessmentId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attempts.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findActiveByUserAndAssessment(
    userId: string,
    assessmentId: string,
  ): Promise<Either<Error, Attempt>> {
    try {
      const attempt = await this.prisma.attempt.findFirst({
        where: {
          userId,
          assessmentId,
          status: 'IN_PROGRESS',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!attempt) {
        return left(new Error('Active attempt not found'));
      }

      return right(this.toDomain(attempt));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByUserId(userId: string): Promise<Either<Error, Attempt[]>> {
    try {
      const attempts = await this.prisma.attempt.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attempts.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Attempt[]>> {
    try {
      const attempts = await this.prisma.attempt.findMany({
        where: { assessmentId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attempts.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(attempt: Attempt): Promise<Either<Error, void>> {
    try {
      await this.prisma.attempt.update({
        where: { id: attempt.id.toString() },
        data: {
          status: attempt.status.getValue(),
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          timeLimitExpiresAt: attempt.timeLimitExpiresAt,
          updatedAt: attempt.updatedAt,
        },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.attempt.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async countByUserAndAssessment(
    userId: string,
    assessmentId: string,
  ): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.attempt.count({
        where: {
          userId,
          assessmentId,
        },
      });

      return right(count);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private toDomain(raw: any): Attempt {
    return Attempt.reconstruct(
      {
        status: new AttemptStatusVO(raw.status),
        score: raw.score ? new ScoreVO(raw.score) : undefined,
        startedAt: raw.startedAt,
        submittedAt: raw.submittedAt,
        gradedAt: raw.gradedAt,
        timeLimitExpiresAt: raw.timeLimitExpiresAt,
        userId: raw.userId,
        assessmentId: raw.assessmentId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }
}
