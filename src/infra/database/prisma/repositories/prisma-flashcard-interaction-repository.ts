// src/infra/database/prisma/repositories/prisma-flashcard-interaction-repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { PrismaService } from '@/prisma/prisma.service';
import {
  IFlashcardInteractionRepository,
  FlashcardInteractionStats,
  UserFlashcardStats,
} from '@/domain/flashcard/application/repositories/i-flashcard-interaction-repository';
import { FlashcardInteraction } from '@/domain/flashcard/enterprise/entities/flashcard-interaction.entity';
import { FlashcardDifficultyLevelVO } from '@/domain/flashcard/enterprise/value-objects/flashcard-difficulty-level.vo';

@Injectable()
export class PrismaFlashcardInteractionRepository
  implements IFlashcardInteractionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndFlashcard(
    identityId: string,
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction | null>> {
    try {
      const interaction = await this.prisma.flashcardInteraction.findUnique({
        where: {
          identityId_flashcardId: {
            identityId,
            flashcardId,
          },
        },
      });

      if (!interaction) {
        return right(null);
      }

      return right(this.mapToEntity(interaction));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByUserId(
    identityId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    try {
      const interactions = await this.prisma.flashcardInteraction.findMany({
        where: { identityId },
        orderBy: { reviewedAt: 'desc' },
      });

      return right(interactions.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByUserIdAndDifficulty(
    identityId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    try {
      const interactions = await this.prisma.flashcardInteraction.findMany({
        where: {
          identityId,
          difficultyLevel: difficulty.getValue(),
        },
        orderBy: { reviewedAt: 'desc' },
      });

      return right(interactions.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByFlashcardId(
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    try {
      const interactions = await this.prisma.flashcardInteraction.findMany({
        where: { flashcardId },
        orderBy: { reviewedAt: 'desc' },
      });

      return right(interactions.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByUserIdAndDateRange(
    identityId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    try {
      const interactions = await this.prisma.flashcardInteraction.findMany({
        where: {
          identityId,
          reviewedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { reviewedAt: 'desc' },
      });

      return right(interactions.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByUserIdAndArgumentId(
    identityId: string,
    argumentId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    try {
      const interactions = await this.prisma.flashcardInteraction.findMany({
        where: {
          identityId,
          flashcard: {
            argumentId,
          },
        },
        orderBy: { reviewedAt: 'desc' },
      });

      return right(interactions.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async createOrUpdate(
    interaction: FlashcardInteraction,
  ): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcardInteraction.upsert({
        where: {
          identityId_flashcardId: {
            identityId: interaction.identityId.toString(),
            flashcardId: interaction.flashcardId.toString(),
          },
        },
        update: {
          difficultyLevel: interaction.difficultyLevel.getValue(),
          reviewedAt: interaction.reviewedAt,
        },
        create: {
          id: interaction.id.toString(),
          identityId: interaction.identityId.toString(),
          flashcardId: interaction.flashcardId.toString(),
          difficultyLevel: interaction.difficultyLevel.getValue(),
          reviewedAt: interaction.reviewedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(
        new Error('Failed to create or update flashcard interaction'),
      );
    }
  }

  async delete(
    identityId: string,
    flashcardId: string,
  ): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcardInteraction.delete({
        where: {
          identityId_flashcardId: {
            identityId,
            flashcardId,
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to delete flashcard interaction'));
    }
  }

  async countByUserIdAndDifficulty(
    identityId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcardInteraction.count({
        where: {
          identityId,
          difficultyLevel: difficulty.getValue(),
        },
      });

      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async countByFlashcardIdAndDifficulty(
    flashcardId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcardInteraction.count({
        where: {
          flashcardId,
          difficultyLevel: difficulty.getValue(),
        },
      });

      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async countByArgumentIdAndDifficulty(
    argumentId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcardInteraction.count({
        where: {
          flashcard: {
            argumentId,
          },
          difficultyLevel: difficulty.getValue(),
        },
      });

      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async getFlashcardStats(
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteractionStats>> {
    try {
      const stats = await this.prisma.flashcardInteraction.groupBy({
        by: ['difficultyLevel'],
        where: { flashcardId },
        _count: { difficultyLevel: true },
      });

      const totalInteractions = stats.reduce(
        (sum, stat) => sum + stat._count.difficultyLevel,
        0,
      );
      const easyCount =
        stats.find((s) => s.difficultyLevel === 'EASY')?._count
          .difficultyLevel || 0;
      const hardCount =
        stats.find((s) => s.difficultyLevel === 'HARD')?._count
          .difficultyLevel || 0;
      const neutralCount =
        stats.find((s) => s.difficultyLevel === 'NEUTRAL')?._count
          .difficultyLevel || 0;

      return right({
        flashcardId,
        totalInteractions,
        easyCount,
        hardCount,
        neutralCount,
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async getUserStatsGroupedByArgument(
    identityId: string,
  ): Promise<Either<Error, UserFlashcardStats[]>> {
    try {
      const rawStats = await this.prisma.$queryRaw<any[]>`
        SELECT 
          f.argument_id as "argumentId",
          COUNT(DISTINCT f.id) as "totalFlashcards",
          COUNT(DISTINCT fi.flashcard_id) as "reviewedFlashcards",
          COUNT(CASE WHEN fi.difficulty_level = 'EASY' THEN 1 END) as "easyCount",
          COUNT(CASE WHEN fi.difficulty_level = 'HARD' THEN 1 END) as "hardCount",
          COUNT(CASE WHEN fi.difficulty_level = 'NEUTRAL' THEN 1 END) as "neutralCount",
          MAX(fi.reviewed_at) as "lastReviewedAt"
        FROM flashcard f
        LEFT JOIN flashcard_interaction fi ON f.id = fi.flashcard_id AND fi.identity_id = ${identityId}
        GROUP BY f.argument_id
      `;

      const stats: UserFlashcardStats[] = rawStats.map((stat) => ({
        identityId,
        argumentId: stat.argumentId,
        totalFlashcards: Number(stat.totalFlashcards),
        reviewedFlashcards: Number(stat.reviewedFlashcards),
        easyCount: Number(stat.easyCount),
        hardCount: Number(stat.hardCount),
        neutralCount: Number(stat.neutralCount),
        lastReviewedAt: stat.lastReviewedAt,
      }));

      return right(stats);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async getUserStatsForArgument(
    identityId: string,
    argumentId: string,
  ): Promise<Either<Error, UserFlashcardStats>> {
    try {
      const rawStat = await this.prisma.$queryRaw<any[]>`
        SELECT 
          f.argument_id as "argumentId",
          COUNT(DISTINCT f.id) as "totalFlashcards",
          COUNT(DISTINCT fi.flashcard_id) as "reviewedFlashcards",
          COUNT(CASE WHEN fi.difficulty_level = 'EASY' THEN 1 END) as "easyCount",
          COUNT(CASE WHEN fi.difficulty_level = 'HARD' THEN 1 END) as "hardCount",
          COUNT(CASE WHEN fi.difficulty_level = 'NEUTRAL' THEN 1 END) as "neutralCount",
          MAX(fi.reviewed_at) as "lastReviewedAt"
        FROM flashcard f
        LEFT JOIN flashcard_interaction fi ON f.id = fi.flashcard_id AND fi.identity_id = ${identityId}
        WHERE f.argument_id = ${argumentId}
        GROUP BY f.argument_id
      `;

      if (rawStat.length === 0) {
        return left(new Error('Argument not found or has no flashcards'));
      }

      const stat = rawStat[0];
      const userStats: UserFlashcardStats = {
        identityId,
        argumentId: stat.argumentId,
        totalFlashcards: Number(stat.totalFlashcards),
        reviewedFlashcards: Number(stat.reviewedFlashcards),
        easyCount: Number(stat.easyCount),
        hardCount: Number(stat.hardCount),
        neutralCount: Number(stat.neutralCount),
        lastReviewedAt: stat.lastReviewedAt,
      };

      return right(userStats);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  private mapToEntity = (interaction: any): FlashcardInteraction => {
    return FlashcardInteraction.reconstruct(
      {
        identityId: new UniqueEntityID(interaction.identityId),
        flashcardId: new UniqueEntityID(interaction.flashcardId),
        difficultyLevel: new FlashcardDifficultyLevelVO(
          interaction.difficultyLevel,
        ),
        reviewedAt: interaction.reviewedAt,
      },
      new UniqueEntityID(interaction.id),
    );
  };
}
