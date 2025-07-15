import { Either } from '@/core/either';
import { FlashcardInteraction } from '../../enterprise/entities/flashcard-interaction.entity';
import { FlashcardDifficultyLevelVO } from '../../enterprise/value-objects/flashcard-difficulty-level.vo';

export interface FlashcardInteractionStats {
  flashcardId: string;
  totalInteractions: number;
  easyCount: number;
  hardCount: number;
  neutralCount: number;
}

export interface UserFlashcardStats {
  userId: string;
  argumentId: string;
  totalFlashcards: number;
  reviewedFlashcards: number;
  easyCount: number;
  hardCount: number;
  neutralCount: number;
  lastReviewedAt?: Date;
}

export abstract class IFlashcardInteractionRepository {
  abstract findByUserAndFlashcard(
    userId: string,
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction | null>>;
  abstract findByUserId(userId: string): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndDifficulty(
    userId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByFlashcardId(flashcardId: string): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndArgumentId(
    userId: string,
    argumentId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract createOrUpdate(interaction: FlashcardInteraction): Promise<Either<Error, void>>;
  abstract delete(userId: string, flashcardId: string): Promise<Either<Error, void>>;
  abstract countByUserIdAndDifficulty(
    userId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>>;
  abstract countByFlashcardIdAndDifficulty(
    flashcardId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>>;
  abstract countByArgumentIdAndDifficulty(
    argumentId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>>;
  abstract getFlashcardStats(flashcardId: string): Promise<Either<Error, FlashcardInteractionStats>>;
  abstract getUserStatsGroupedByArgument(
    userId: string,
  ): Promise<Either<Error, UserFlashcardStats[]>>;
  abstract getUserStatsForArgument(
    userId: string,
    argumentId: string,
  ): Promise<Either<Error, UserFlashcardStats>>;
}