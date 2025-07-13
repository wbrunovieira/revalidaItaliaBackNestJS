// src/infra/database/prisma/repositories/prisma-answer-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { IAnswerRepository } from '@/domain/assessment/application/repositories/i-answer.repository';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AnswerTranslationVO } from '@/domain/assessment/enterprise/value-objects/answer-translation.vo';
import {
  Answer as PrismaAnswer,
  AnswerTranslation as PrismaAnswerTranslation,
} from '@prisma/client';

type PrismaAnswerWithTranslations = PrismaAnswer & {
  translations: PrismaAnswerTranslation[];
};

@Injectable()
export class PrismaAnswerRepository implements IAnswerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(answer: Answer): Promise<Either<Error, void>> {
    try {
      await this.prisma.answer.create({
        data: {
          id: answer.id.toString(),
          correctOptionId: answer.correctOptionId?.toString(),
          explanation: answer.explanation,
          questionId: answer.questionId.toString(),
          createdAt: answer.createdAt,
          updatedAt: answer.updatedAt,
          translations: {
            create: answer.translations.map((translation) => ({
              locale: translation.locale,
              explanation: translation.explanation,
            })),
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findById(id: string): Promise<Either<Error, Answer>> {
    try {
      const data = await this.prisma.answer.findUnique({
        where: { id },
        include: {
          translations: true,
        },
      });

      if (!data) {
        return left(new Error('Answer not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findByQuestionId(questionId: string): Promise<Either<Error, Answer>> {
    try {
      const data = await this.prisma.answer.findUnique({
        where: { questionId },
        include: {
          translations: true,
        },
      });

      if (!data) {
        return left(new Error('Answer not found'));
      }

      return right(this.mapToEntity(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findManyByQuestionIds(questionIds: string[]): Promise<Either<Error, Answer[]>> {
    try {
      const data = await this.prisma.answer.findMany({
        where: {
          questionId: {
            in: questionIds,
          },
        },
        include: {
          translations: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const answers = data.map((item) => this.mapToEntity(item));
      return right(answers);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async update(answer: Answer): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update answer
        await tx.answer.update({
          where: { id: answer.id.toString() },
          data: {
            correctOptionId: answer.correctOptionId?.toString(),
            explanation: answer.explanation,
            updatedAt: answer.updatedAt,
          },
        });

        // Delete existing translations
        await tx.answerTranslation.deleteMany({
          where: { answerId: answer.id.toString() },
        });

        // Create new translations
        await tx.answerTranslation.createMany({
          data: answer.translations.map((translation) => ({
            answerId: answer.id.toString(),
            locale: translation.locale,
            explanation: translation.explanation,
          })),
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete translations first (foreign key constraint)
        await tx.answerTranslation.deleteMany({
          where: { answerId: id },
        });

        // Delete answer
        await tx.answer.delete({
          where: { id },
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async exists(id: string): Promise<Either<Error, boolean>> {
    try {
      const count = await this.prisma.answer.count({
        where: { id },
      });

      return right(count > 0);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async existsByQuestionId(questionId: string): Promise<Either<Error, boolean>> {
    try {
      const count = await this.prisma.answer.count({
        where: { questionId },
      });

      return right(count > 0);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  private mapToEntity(data: PrismaAnswerWithTranslations): Answer {
    const translations = data.translations.map(
      (translation) =>
        new AnswerTranslationVO(
          translation.locale as 'pt' | 'it' | 'es',
          translation.explanation,
        ),
    );

    const props = {
      correctOptionId: data.correctOptionId ? new UniqueEntityID(data.correctOptionId) : undefined,
      explanation: data.explanation,
      questionId: new UniqueEntityID(data.questionId),
      translations,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Answer.reconstruct(props, new UniqueEntityID(data.id));
  }
}