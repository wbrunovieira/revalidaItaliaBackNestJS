export type FlashcardDifficultyLevelValue = 'EASY' | 'HARD' | 'NEUTRAL';

export class FlashcardDifficultyLevelVO {
  constructor(private readonly value: FlashcardDifficultyLevelValue) {
    this.validate();
  }

  private validate(): void {
    const validLevels: FlashcardDifficultyLevelValue[] = ['EASY', 'HARD', 'NEUTRAL'];
    if (!validLevels.includes(this.value)) {
      throw new Error(`Invalid flashcard difficulty level: ${this.value}`);
    }
  }

  public getValue(): FlashcardDifficultyLevelValue {
    return this.value;
  }

  public isEasy(): boolean {
    return this.value === 'EASY';
  }

  public isHard(): boolean {
    return this.value === 'HARD';
  }

  public isNeutral(): boolean {
    return this.value === 'NEUTRAL';
  }

  public equals(other: FlashcardDifficultyLevelVO): boolean {
    return this.value === other.value;
  }

  public static easy(): FlashcardDifficultyLevelVO {
    return new FlashcardDifficultyLevelVO('EASY');
  }

  public static hard(): FlashcardDifficultyLevelVO {
    return new FlashcardDifficultyLevelVO('HARD');
  }

  public static neutral(): FlashcardDifficultyLevelVO {
    return new FlashcardDifficultyLevelVO('NEUTRAL');
  }
}