export type FlashcardContentTypeValue = 'TEXT' | 'IMAGE';

export class FlashcardContentTypeVO {
  constructor(private readonly value: FlashcardContentTypeValue) {
    this.validate();
  }

  private validate(): void {
    const validTypes: FlashcardContentTypeValue[] = ['TEXT', 'IMAGE'];
    if (!validTypes.includes(this.value)) {
      throw new Error(`Invalid flashcard content type: ${this.value}`);
    }
  }

  public getValue(): FlashcardContentTypeValue {
    return this.value;
  }

  public isText(): boolean {
    return this.value === 'TEXT';
  }

  public isImage(): boolean {
    return this.value === 'IMAGE';
  }

  public equals(other: FlashcardContentTypeVO): boolean {
    return this.value === other.value;
  }

  public static text(): FlashcardContentTypeVO {
    return new FlashcardContentTypeVO('TEXT');
  }

  public static image(): FlashcardContentTypeVO {
    return new FlashcardContentTypeVO('IMAGE');
  }
}