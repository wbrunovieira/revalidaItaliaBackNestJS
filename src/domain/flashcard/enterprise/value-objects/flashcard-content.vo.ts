import { FlashcardContentTypeVO } from './flashcard-content-type.vo';

export class FlashcardContentVO {
  constructor(
    private readonly type: FlashcardContentTypeVO,
    private readonly content: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Flashcard content cannot be empty');
    }

    if (this.type.isText()) {
      if (this.content.length > 1000) {
        throw new Error('Text content cannot exceed 1000 characters');
      }
    }

    if (this.type.isImage()) {
      if (!this.isValidImageUrl(this.content)) {
        throw new Error('Invalid image URL format');
      }
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  public getType(): FlashcardContentTypeVO {
    return this.type;
  }

  public getContent(): string {
    return this.content;
  }

  public isText(): boolean {
    return this.type.isText();
  }

  public isImage(): boolean {
    return this.type.isImage();
  }

  public equals(other: FlashcardContentVO): boolean {
    return this.type.equals(other.type) && this.content === other.content;
  }

  public static createText(content: string): FlashcardContentVO {
    return new FlashcardContentVO(FlashcardContentTypeVO.text(), content);
  }

  public static createImage(imageUrl: string): FlashcardContentVO {
    return new FlashcardContentVO(FlashcardContentTypeVO.image(), imageUrl);
  }
}