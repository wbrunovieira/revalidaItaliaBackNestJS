import { Either, left, right } from '@/core/either';
import {
  IFlashcardInteractionRepository,
  FlashcardInteractionStats,
  UserFlashcardStats,
} from '@/domain/flashcard/application/repositories/i-flashcard-interaction-repository';
import { FlashcardInteraction } from '@/domain/flashcard/enterprise/entities/flashcard-interaction.entity';
import { FlashcardDifficultyLevelVO } from '@/domain/flashcard/enterprise/value-objects/flashcard-difficulty-level.vo';
import { Flashcard } from '@/domain/flashcard/enterprise/entities/flashcard.entity';

export class InMemoryFlashcardInteractionRepository implements IFlashcardInteractionRepository {
  public items: FlashcardInteraction[] = [];
  
  // Para simular joins em queries complexas
  public flashcards: Flashcard[] = [];

  async findByUserAndFlashcard(
    userId: string,
    flashcardId: string,
  ): Promise<Either<Error, FlashcardInteraction | null>> {
    const interaction = this.items.find(
      (item) => 
        item.userId.toString() === userId && 
        item.flashcardId.toString() === flashcardId
    );

    return right(interaction || null);
  }

  async findByUserId(userId: string): Promise<Either<Error, FlashcardInteraction[]>> {
    const interactions = this.items
      .filter((item) => item.userId.toString() === userId)
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return right(interactions);
  }

  async findByUserIdAndDifficulty(
    userId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    const interactions = this.items
      .filter((item) => 
        item.userId.toString() === userId && 
        item.difficultyLevel.equals(difficulty)
      )
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return right(interactions);
  }

  async findByFlashcardId(flashcardId: string): Promise<Either<Error, FlashcardInteraction[]>> {
    const interactions = this.items
      .filter((item) => item.flashcardId.toString() === flashcardId)
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return right(interactions);
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    const interactions = this.items
      .filter((item) => 
        item.userId.toString() === userId &&
        item.reviewedAt >= startDate &&
        item.reviewedAt <= endDate
      )
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return right(interactions);
  }

  async findByUserIdAndArgumentId(
    userId: string,
    argumentId: string,
  ): Promise<Either<Error, FlashcardInteraction[]>> {
    const interactions = this.items
      .filter((item) => {
        if (item.userId.toString() !== userId) return false;
        
        const flashcard = this.flashcards.find(
          (f) => f.id.toString() === item.flashcardId.toString()
        );
        
        return flashcard?.argumentId.toString() === argumentId;
      })
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return right(interactions);
  }

  async createOrUpdate(interaction: FlashcardInteraction): Promise<Either<Error, void>> {
    const existingIndex = this.items.findIndex(
      (item) => 
        item.userId.equals(interaction.userId) && 
        item.flashcardId.equals(interaction.flashcardId)
    );

    if (existingIndex >= 0) {
      // Update existing
      this.items[existingIndex] = interaction;
    } else {
      // Create new
      this.items.push(interaction);
    }

    return right(undefined);
  }

  async delete(userId: string, flashcardId: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex(
      (item) => 
        item.userId.toString() === userId && 
        item.flashcardId.toString() === flashcardId
    );

    if (index < 0) {
      return left(new Error('FlashcardInteraction not found'));
    }

    this.items.splice(index, 1);
    return right(undefined);
  }

  async countByUserIdAndDifficulty(
    userId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    const count = this.items.filter(
      (item) => 
        item.userId.toString() === userId && 
        item.difficultyLevel.equals(difficulty)
    ).length;

    return right(count);
  }

  async countByFlashcardIdAndDifficulty(
    flashcardId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    const count = this.items.filter(
      (item) => 
        item.flashcardId.toString() === flashcardId && 
        item.difficultyLevel.equals(difficulty)
    ).length;

    return right(count);
  }

  async countByArgumentIdAndDifficulty(
    argumentId: string,
    difficulty: FlashcardDifficultyLevelVO,
  ): Promise<Either<Error, number>> {
    const count = this.items.filter((item) => {
      const flashcard = this.flashcards.find(
        (f) => f.id.toString() === item.flashcardId.toString()
      );
      
      return (
        flashcard?.argumentId.toString() === argumentId &&
        item.difficultyLevel.equals(difficulty)
      );
    }).length;

    return right(count);
  }

  async getFlashcardStats(flashcardId: string): Promise<Either<Error, FlashcardInteractionStats>> {
    const interactions = this.items.filter(
      (item) => item.flashcardId.toString() === flashcardId
    );

    const totalInteractions = interactions.length;
    const easyCount = interactions.filter((item) => item.difficultyLevel.isEasy()).length;
    const hardCount = interactions.filter((item) => item.difficultyLevel.isHard()).length;
    const neutralCount = interactions.filter((item) => item.difficultyLevel.isNeutral()).length;

    return right({
      flashcardId,
      totalInteractions,
      easyCount,
      hardCount,
      neutralCount,
    });
  }

  async getUserStatsGroupedByArgument(
    userId: string,
  ): Promise<Either<Error, UserFlashcardStats[]>> {
    const argumentGroups = new Map<string, {
      totalFlashcards: number;
      reviewedFlashcards: Set<string>;
      easyCount: number;
      hardCount: number;
      neutralCount: number;
      lastReviewedAt?: Date;
    }>();

    // Group flashcards by argument
    for (const flashcard of this.flashcards) {
      const argumentId = flashcard.argumentId.toString();
      if (!argumentGroups.has(argumentId)) {
        argumentGroups.set(argumentId, {
          totalFlashcards: 0,
          reviewedFlashcards: new Set(),
          easyCount: 0,
          hardCount: 0,
          neutralCount: 0,
        });
      }
      
      const group = argumentGroups.get(argumentId)!;
      group.totalFlashcards++;
    }

    // Add interaction stats
    const userInteractions = this.items.filter(
      (item) => item.userId.toString() === userId
    );

    for (const interaction of userInteractions) {
      const flashcard = this.flashcards.find(
        (f) => f.id.toString() === interaction.flashcardId.toString()
      );
      
      if (!flashcard) continue;
      
      const argumentId = flashcard.argumentId.toString();
      const group = argumentGroups.get(argumentId);
      
      if (!group) continue;
      
      group.reviewedFlashcards.add(interaction.flashcardId.toString());
      
      if (interaction.difficultyLevel.isEasy()) group.easyCount++;
      else if (interaction.difficultyLevel.isHard()) group.hardCount++;
      else if (interaction.difficultyLevel.isNeutral()) group.neutralCount++;
      
      if (!group.lastReviewedAt || interaction.reviewedAt > group.lastReviewedAt) {
        group.lastReviewedAt = interaction.reviewedAt;
      }
    }

    const stats: UserFlashcardStats[] = Array.from(argumentGroups.entries()).map(
      ([argumentId, group]) => ({
        userId,
        argumentId,
        totalFlashcards: group.totalFlashcards,
        reviewedFlashcards: group.reviewedFlashcards.size,
        easyCount: group.easyCount,
        hardCount: group.hardCount,
        neutralCount: group.neutralCount,
        lastReviewedAt: group.lastReviewedAt,
      })
    );

    return right(stats);
  }

  async getUserStatsForArgument(
    userId: string,
    argumentId: string,
  ): Promise<Either<Error, UserFlashcardStats>> {
    const argumentFlashcards = this.flashcards.filter(
      (f) => f.argumentId.toString() === argumentId
    );

    if (argumentFlashcards.length === 0) {
      return left(new Error('Argument not found or has no flashcards'));
    }

    const userInteractions = this.items.filter(
      (item) => {
        if (item.userId.toString() !== userId) return false;
        
        return argumentFlashcards.some(
          (f) => f.id.toString() === item.flashcardId.toString()
        );
      }
    );

    const reviewedFlashcards = new Set(
      userInteractions.map((i) => i.flashcardId.toString())
    );

    const easyCount = userInteractions.filter((i) => i.difficultyLevel.isEasy()).length;
    const hardCount = userInteractions.filter((i) => i.difficultyLevel.isHard()).length;
    const neutralCount = userInteractions.filter((i) => i.difficultyLevel.isNeutral()).length;

    const lastReviewedAt = userInteractions.length > 0
      ? userInteractions.reduce((latest, interaction) => 
          interaction.reviewedAt > latest ? interaction.reviewedAt : latest,
          userInteractions[0].reviewedAt
        )
      : undefined;

    const stats: UserFlashcardStats = {
      userId,
      argumentId,
      totalFlashcards: argumentFlashcards.length,
      reviewedFlashcards: reviewedFlashcards.size,
      easyCount,
      hardCount,
      neutralCount,
      lastReviewedAt,
    };

    return right(stats);
  }
}