// src/infra/database/prisma/repositories/prisma-question-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import {
  IQuestionRepository,
  PaginatedQuestionsResult,
} from '@/domain/assessment/application/repositories/i-question-repository';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { Question as PrismaQuestion, QuestionType } from '@prisma/client';

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Either<Error, Question>> {
    try {
      const data = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!data) {
        return left(new Error('Question not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, Question[]>> {
    try {
      const data = await this.prisma.question.findMany({
        where: { assessmentId },
        orderBy: { createdAt: 'asc' },
      });

      const questions = data.map((item) => this.mapToEntity(item));
      return right(questions);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByArgumentId(
    argumentId: string,
  ): Promise<Either<Error, Question[]>> {
    try {
      const data = await this.prisma.question.findMany({
        where: { argumentId },
        orderBy: { createdAt: 'asc' },
      });

      const questions = data.map((item) => this.mapToEntity(item));
      return right(questions);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByAssessmentIdAndArgumentId(
    assessmentId: string,
    argumentId: string,
  ): Promise<Either<Error, Question[]>> {
    try {
      const data = await this.prisma.question.findMany({
        where: {
          assessmentId,
          argumentId,
        },
        orderBy: { createdAt: 'asc' },
      });

      const questions = data.map((item) => this.mapToEntity(item));
      return right(questions);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async create(question: Question): Promise<Either<Error, void>> {
    try {
      await this.prisma.question.create({
        data: {
          id: question.id.toString(),
          text: question.text,
          type: question.type.getValue() as QuestionType,
          assessmentId: question.assessmentId.toString(),
          argumentId: question.argumentId?.toString(),
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, Question[]>> {
    try {
      let take: number | undefined;
      let skip: number | undefined;

      if (params) {
        take = params.pageSize;
        skip = (params.page - 1) * params.pageSize;
      }

      const data = await this.prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      const questions = data.map((item) => this.mapToEntity(item));
      return right(questions);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedQuestionsResult>> {
    try {
      const [data, total] = await this.prisma.$transaction([
        this.prisma.question.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.question.count(),
      ]);

      const questions = data.map((item) => this.mapToEntity(item));
      return right({ questions, total });
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async update(question: Question): Promise<Either<Error, void>> {
    try {
      await this.prisma.question.update({
        where: { id: question.id.toString() },
        data: {
          text: question.text,
          type: question.type.getValue() as QuestionType,
          assessmentId: question.assessmentId.toString(),
          argumentId: question.argumentId?.toString(),
          updatedAt: question.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.question.delete({
        where: { id },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async countByAssessmentId(
    assessmentId: string,
  ): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.question.count({
        where: { assessmentId },
      });

      return right(count);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async countByArgumentId(argumentId: string): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.question.count({
        where: { argumentId },
      });

      return right(count);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  private mapToEntity(data: PrismaQuestion): Question {
    const props = {
      text: data.text,
      type: new QuestionTypeVO(data.type as 'MULTIPLE_CHOICE' | 'OPEN'),
      assessmentId: new UniqueEntityID(data.assessmentId),
      argumentId: data.argumentId
        ? new UniqueEntityID(data.argumentId)
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Question.reconstruct(props, new UniqueEntityID(data.id));
  }
}
