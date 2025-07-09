// src/domain/assessment/enterprise/value-objects/question-type.vo.ts
export type QuestionTypeValue = 'MULTIPLE_CHOICE' | 'OPEN';

export class QuestionTypeVO {
  constructor(private readonly value: QuestionTypeValue) {
    this.validate();
  }

  private validate(): void {
    const validTypes: QuestionTypeValue[] = ['MULTIPLE_CHOICE', 'OPEN'];
    if (!validTypes.includes(this.value)) {
      throw new Error(`Invalid question type: ${this.value}`);
    }
  }

  public getValue(): QuestionTypeValue {
    return this.value;
  }

  public isMultipleChoice(): boolean {
    return this.value === 'MULTIPLE_CHOICE';
  }

  public isOpen(): boolean {
    return this.value === 'OPEN';
  }

  public equals(other: QuestionTypeVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
