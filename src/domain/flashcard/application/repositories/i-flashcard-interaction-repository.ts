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
  identityId: string;
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
    identityId: string,
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction | null>>;
  abstract findByUserId(
    identityId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndDifficulty(
    identityId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByFlashcardId(
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndDateRange(
    identityId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract findByUserIdAndArgumentId(
    identityId: string,
    argumentId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>>;
  abstract createOrUpdate(
    interaction: FlashcardInteraction,
  ): Promise<Either<Error, void>>;
  abstract delete(
    identityId: string,
    flashcardId: string,
  ): Promise<Either<Error, void>>;
  abstract countByUserIdAndDifficulty(
    identityId: string,
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
  abstract getFlashcardStats(
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteractionStats>>;
  abstract getUserStatsGroupedByArgument(
    identityId: string,
  ): Promise<Either<Error, UserFlashcardStats[]>>;
  abstract getUserStatsForArgument(
    identityId: string,
    argumentId: string,
  ): Promise<Either<Error, UserFlashcardStats>>;
}
