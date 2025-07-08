// src/domain/assessment/enterprise/value-objects/score.vo.ts
export class ScoreVO {
  constructor(private readonly value: number) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 0 || this.value > 100) {
      throw new Error(`Score must be between 0 and 100, got: ${this.value}`);
    }
  }

  public getValue(): number {
    return this.value;
  }

  public isPassing(passingScore: number): boolean {
    return this.value >= passingScore;
  }

  public getPercentage(): number {
    return this.value;
  }

  public equals(other: ScoreVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return `${this.value}%`;
  }
}