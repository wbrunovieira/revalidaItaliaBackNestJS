// src/infra/database/prisma/repositories/prisma-question-option-repository.ts

import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';

import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { IQuestionOptionRepository } from '@/domain/assessment/application/repositories/i-question-option-repository';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaQuestionOptionRepository
  implements IQuestionOptionRepository
{
  constructor(private prisma: PrismaService) {}

  async create(
    questionOption: QuestionOption,
  ): Promise<Either<Error, QuestionOption>> {
    try {
      const data = {
        id: questionOption.id.toString(),
        text: questionOption.text,
        questionId: questionOption.questionId.toString(),
        createdAt: questionOption.createdAt,
        updatedAt: questionOption.updatedAt,
      };

      await this.prisma.questionOption.create({ data });

      return right(questionOption);
    } catch (error) {
      return left(new Error('Failed to create question option'));
    }
  }

  async findById(id: string): Promise<Either<Error, QuestionOption>> {
    try {
      const questionOption = await this.prisma.questionOption.findUnique({
        where: { id },
      });

      if (!questionOption) {
        return left(new Error('Question option not found'));
      }

      const entity = QuestionOption.reconstruct(
        {
          text: questionOption.text,
          questionId: new UniqueEntityID(questionOption.questionId),
          createdAt: questionOption.createdAt,
          updatedAt: questionOption.updatedAt,
        },
        new UniqueEntityID(questionOption.id),
      );

      return right(entity);
    } catch (error) {
      return left(new Error('Failed to find question option'));
    }
  }

  async findByQuestionId(
    questionId: string,
  ): Promise<Either<Error, QuestionOption[]>> {
    try {
      const questionOptions = await this.prisma.questionOption.findMany({
        where: { questionId },
        orderBy: { createdAt: 'asc' },
      });

      const entities = questionOptions.map((option) =>
        QuestionOption.reconstruct(
          {
            text: option.text,
            questionId: new UniqueEntityID(option.questionId),
            createdAt: option.createdAt,
            updatedAt: option.updatedAt,
          },
          new UniqueEntityID(option.id),
        ),
      );

      return right(entities);
    } catch (error) {
      return left(new Error('Failed to find question options'));
    }
  }

  async findByQuestionIds(
    questionIds: string[],
  ): Promise<Either<Error, QuestionOption[]>> {
    try {
      const questionOptions = await this.prisma.questionOption.findMany({
        where: { 
          questionId: {
            in: questionIds
          }
        },
        orderBy: { createdAt: 'asc' },
      });

      const entities = questionOptions.map((option) =>
        QuestionOption.reconstruct(
          {
            text: option.text,
            questionId: new UniqueEntityID(option.questionId),
            createdAt: option.createdAt,
            updatedAt: option.updatedAt,
          },
          new UniqueEntityID(option.id),
        ),
      );

      return right(entities);
    } catch (error) {
      return left(new Error('Failed to find question options'));
    }
  }

  async update(
    questionOption: QuestionOption,
  ): Promise<Either<Error, QuestionOption>> {
    try {
      const data = {
        text: questionOption.text,
        updatedAt: questionOption.updatedAt,
      };

      await this.prisma.questionOption.update({
        where: { id: questionOption.id.toString() },
        data,
      });

      return right(questionOption);
    } catch (error) {
      return left(new Error('Failed to update question option'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.questionOption.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(new Error('Failed to delete question option'));
    }
  }
}
