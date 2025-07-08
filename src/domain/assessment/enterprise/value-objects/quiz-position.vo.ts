// src/domain/assessment/enterprise/value-objects/quiz-position.vo.ts
export type QuizPositionValue = 'BEFORE_LESSON' | 'AFTER_LESSON';

export class QuizPositionVO {
  constructor(private readonly value: QuizPositionValue) {
    this.validate();
  }

  private validate(): void {
    const validPositions: QuizPositionValue[] = ['BEFORE_LESSON', 'AFTER_LESSON'];
    if (!validPositions.includes(this.value)) {
      throw new Error(`Invalid quiz position: ${this.value}`);
    }
  }

  public getValue(): QuizPositionValue {
    return this.value;
  }

  public isBefore(): boolean {
    return this.value === 'BEFORE_LESSON';
  }

  public isAfter(): boolean {
    return this.value === 'AFTER_LESSON';
  }

  public equals(other: QuizPositionVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}