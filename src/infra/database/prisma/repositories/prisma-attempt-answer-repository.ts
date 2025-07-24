// src/infra/database/prisma/repositories/prisma-attempt-answer-repository.ts
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';

import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { IAttemptAnswerRepository } from '@/domain/assessment/application/repositories/i-attempt-answer-repository';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaAttemptAnswerRepository implements IAttemptAnswerRepository {
  constructor(private prisma: PrismaService) {}

  async create(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>> {
    try {
      await this.prisma.attemptAnswer.create({
        data: {
          id: attemptAnswer.id.toString(),
          selectedOptionId: attemptAnswer.selectedOptionId,
          textAnswer: attemptAnswer.textAnswer,
          status: attemptAnswer.status.getValue(),
          isCorrect: attemptAnswer.isCorrect,
          teacherComment: attemptAnswer.teacherComment,
          reviewerId: attemptAnswer.reviewerId,
          attemptId: attemptAnswer.attemptId,
          questionId: attemptAnswer.questionId,
          createdAt: attemptAnswer.createdAt,
          updatedAt: attemptAnswer.updatedAt,
        },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findById(id: string): Promise<Either<Error, AttemptAnswer>> {
    try {
      const attemptAnswer = await this.prisma.attemptAnswer.findUnique({
        where: { id },
      });

      if (!attemptAnswer) {
        return left(new Error('Attempt answer not found'));
      }

      return right(this.toDomain(attemptAnswer));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByAttemptId(
    attemptId: string,
  ): Promise<Either<Error, AttemptAnswer[]>> {
    try {
      const attemptAnswers = await this.prisma.attemptAnswer.findMany({
        where: { attemptId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attemptAnswers.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByAttemptIdAndQuestionId(
    attemptId: string,
    questionId: string,
  ): Promise<Either<Error, AttemptAnswer>> {
    try {
      const attemptAnswer = await this.prisma.attemptAnswer.findFirst({
        where: {
          attemptId,
          questionId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!attemptAnswer) {
        return left(new Error('Attempt answer not found'));
      }

      return right(this.toDomain(attemptAnswer));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByQuestionId(
    questionId: string,
  ): Promise<Either<Error, AttemptAnswer[]>> {
    try {
      const attemptAnswers = await this.prisma.attemptAnswer.findMany({
        where: { questionId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attemptAnswers.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(attemptAnswer: AttemptAnswer): Promise<Either<Error, void>> {
    try {
      await this.prisma.attemptAnswer.update({
        where: { id: attemptAnswer.id.toString() },
        data: {
          selectedOptionId: attemptAnswer.selectedOptionId,
          textAnswer: attemptAnswer.textAnswer,
          status: attemptAnswer.status.getValue(),
          isCorrect: attemptAnswer.isCorrect,
          teacherComment: attemptAnswer.teacherComment,
          reviewerId: attemptAnswer.reviewerId,
          updatedAt: attemptAnswer.updatedAt,
        },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.attemptAnswer.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteByAttemptId(attemptId: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.attemptAnswer.deleteMany({
        where: { attemptId },
      });

      return right(undefined);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByReviewerId(
    reviewerId: string,
  ): Promise<Either<Error, AttemptAnswer[]>> {
    try {
      const attemptAnswers = await this.prisma.attemptAnswer.findMany({
        where: { reviewerId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return right(attemptAnswers.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findPendingReviewsByStatus(
    status: 'SUBMITTED' | 'GRADING' = 'SUBMITTED',
  ): Promise<Either<Error, AttemptAnswer[]>> {
    try {
      const attemptAnswers = await this.prisma.attemptAnswer.findMany({
        where: {
          status: status as any, // Cast to satisfy Prisma enum
          reviewerId: null,
        },
        orderBy: {
          createdAt: 'asc', // Oldest first for review queue
        },
      });

      return right(attemptAnswers.map(this.toDomain));
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async countByAttemptId(attemptId: string): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.attemptAnswer.count({
        where: { attemptId },
      });

      return right(count);
    } catch (error) {
      return left(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private toDomain(raw: any): AttemptAnswer {
    return AttemptAnswer.reconstruct(
      {
        selectedOptionId: raw.selectedOptionId,
        textAnswer: raw.textAnswer,
        status: new AttemptStatusVO(raw.status),
        isCorrect: raw.isCorrect,
        teacherComment: raw.teacherComment,
        reviewerId: raw.reviewerId,
        attemptId: raw.attemptId,
        questionId: raw.questionId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }
}
