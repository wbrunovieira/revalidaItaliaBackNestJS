import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { FlashcardDifficultyLevelVO } from '../value-objects/flashcard-difficulty-level.vo';

export interface FlashcardInteractionProps {
  identityId: UniqueEntityID;
  flashcardId: UniqueEntityID;
  difficultyLevel: FlashcardDifficultyLevelVO;
  reviewedAt: Date;
}

export class FlashcardInteraction extends Entity<FlashcardInteractionProps> {
  private constructor(props: FlashcardInteractionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<FlashcardInteractionProps, 'reviewedAt'> & {
      reviewedAt?: Date;
    },
    id?: UniqueEntityID,
  ): FlashcardInteraction {
    // Validações
    if (!props.identityId) {
      throw new Error('IdentityId is required');
    }

    if (!props.flashcardId) {
      throw new Error('FlashcardId is required');
    }

    if (!props.difficultyLevel) {
      throw new Error('DifficultyLevel is required');
    }

    return new FlashcardInteraction(
      {
        ...props,
        reviewedAt: props.reviewedAt || new Date(),
      },
      id,
    );
  }

  public static reconstruct(
    props: FlashcardInteractionProps,
    id: UniqueEntityID,
  ): FlashcardInteraction {
    return new FlashcardInteraction(props, id);
  }

  // Getters
  public get identityId(): UniqueEntityID {
    return this.props.identityId;
  }

  public get flashcardId(): UniqueEntityID {
    return this.props.flashcardId;
  }

  public get difficultyLevel(): FlashcardDifficultyLevelVO {
    return this.props.difficultyLevel;
  }

  public get reviewedAt(): Date {
    return this.props.reviewedAt;
  }

  // Business Logic Methods
  public belongsToUser(identityId: UniqueEntityID): boolean {
    return this.props.identityId.equals(identityId);
  }

  public belongsToFlashcard(flashcardId: UniqueEntityID): boolean {
    return this.props.flashcardId.equals(flashcardId);
  }

  public isEasy(): boolean {
    return this.props.difficultyLevel.isEasy();
  }

  public isHard(): boolean {
    return this.props.difficultyLevel.isHard();
  }

  public isNeutral(): boolean {
    return this.props.difficultyLevel.isNeutral();
  }

  public wasReviewedAfter(date: Date): boolean {
    return this.props.reviewedAt > date;
  }

  public wasReviewedBefore(date: Date): boolean {
    return this.props.reviewedAt < date;
  }

  public wasReviewedToday(): boolean {
    const today = new Date();
    const reviewDate = this.props.reviewedAt;
    
    return (
      reviewDate.getDate() === today.getDate() &&
      reviewDate.getMonth() === today.getMonth() &&
      reviewDate.getFullYear() === today.getFullYear()
    );
  }

  public getDaysSinceReview(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.props.reviewedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Update Methods
  public updateDifficultyLevel(difficultyLevel: FlashcardDifficultyLevelVO): void {
    if (!difficultyLevel) {
      throw new Error('DifficultyLevel cannot be empty');
    }

    this.props.difficultyLevel = difficultyLevel;
    this.props.reviewedAt = new Date(); // Atualiza o timestamp da revisão
  }

  public markAsEasy(): void {
    this.updateDifficultyLevel(FlashcardDifficultyLevelVO.easy());
  }

  public markAsHard(): void {
    this.updateDifficultyLevel(FlashcardDifficultyLevelVO.hard());
  }

  public markAsNeutral(): void {
    this.updateDifficultyLevel(FlashcardDifficultyLevelVO.neutral());
  }

  public updateReviewedAt(reviewedAt: Date): void {
    if (!reviewedAt) {
      throw new Error('ReviewedAt cannot be empty');
    }

    if (reviewedAt > new Date()) {
      throw new Error('ReviewedAt cannot be in the future');
    }

    this.props.reviewedAt = reviewedAt;
  }

  public toResponseObject(): {
    id: string;
    identityId: string;
    flashcardId: string;
    difficultyLevel: string;
    reviewedAt: Date;
  } {
    return {
      id: this.id.toString(),
      identityId: this.identityId.toString(),
      flashcardId: this.flashcardId.toString(),
      difficultyLevel: this.difficultyLevel.getValue(),
      reviewedAt: this.reviewedAt,
    };
  }
}