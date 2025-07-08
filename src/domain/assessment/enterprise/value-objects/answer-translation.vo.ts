// src/domain/assessment/enterprise/value-objects/answer-translation.vo.ts
export class AnswerTranslationVO {
  constructor(
    public readonly locale: 'pt' | 'it' | 'es',
    public readonly explanation: string
  ) {
    this.validate();
  }

  private validate(): void {
    const validLocales = ['pt', 'it', 'es'];
    if (!validLocales.includes(this.locale)) {
      throw new Error(`Invalid locale: ${this.locale}`);
    }

    if (!this.explanation.trim()) {
      throw new Error('Explanation cannot be empty');
    }
  }

  public equals(other: AnswerTranslationVO): boolean {
    return this.locale === other.locale && this.explanation === other.explanation;
  }
}