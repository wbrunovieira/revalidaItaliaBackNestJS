import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { FlashcardContentVO } from '../value-objects/flashcard-content.vo';

export interface FlashcardProps {
  slug: string;
  question: FlashcardContentVO;
  answer: FlashcardContentVO;
  argumentId: UniqueEntityID;
  tagIds: UniqueEntityID[];
  importBatchId?: string; // TODO: Implementar validação quando definida
  exportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Flashcard extends Entity<FlashcardProps> {
  private constructor(props: FlashcardProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<FlashcardProps, 'createdAt' | 'updatedAt' | 'slug'> & {
      slug?: string;
    },
    id?: UniqueEntityID,
  ): Flashcard {
    const now = new Date();

    // Validações
    if (!props.question) {
      throw new Error('Question is required');
    }

    if (!props.answer) {
      throw new Error('Answer is required');
    }

    if (!props.argumentId) {
      throw new Error('ArgumentId is required');
    }

    // Auto-generate slug if not provided
    const slug = props.slug || Flashcard.generateSlug();

    return new Flashcard(
      {
        ...props,
        slug,
        tagIds: props.tagIds || [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: FlashcardProps,
    id: UniqueEntityID,
  ): Flashcard {
    return new Flashcard(props, id);
  }

  private static generateSlug(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `flashcard-${timestamp}-${random}`;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // Getters
  public get slug(): string {
    return this.props.slug;
  }

  public get question(): FlashcardContentVO {
    return this.props.question;
  }

  public get answer(): FlashcardContentVO {
    return this.props.answer;
  }

  public get argumentId(): UniqueEntityID {
    return this.props.argumentId;
  }

  public get tagIds(): UniqueEntityID[] {
    return [...this.props.tagIds];
  }

  public get importBatchId(): string | undefined {
    return this.props.importBatchId;
  }

  public get exportedAt(): Date | undefined {
    return this.props.exportedAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  public hasTag(tagId: UniqueEntityID): boolean {
    return this.props.tagIds.some((id) => id.equals(tagId));
  }

  public hasAnyTag(tagIds: UniqueEntityID[]): boolean {
    return tagIds.some((tagId) => this.hasTag(tagId));
  }

  public belongsToArgument(argumentId: UniqueEntityID): boolean {
    return this.props.argumentId.equals(argumentId);
  }

  public isFromImportBatch(batchId: string): boolean {
    return this.props.importBatchId === batchId;
  }

  public wasExported(): boolean {
    return this.props.exportedAt !== undefined;
  }

  // Update Methods
  public updateQuestion(question: FlashcardContentVO): void {
    if (!question) {
      throw new Error('Question cannot be empty');
    }
    this.props.question = question;
    this.touch();
  }

  public updateAnswer(answer: FlashcardContentVO): void {
    if (!answer) {
      throw new Error('Answer cannot be empty');
    }
    this.props.answer = answer;
    this.touch();
  }

  public updateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Slug cannot be empty');
    }
    this.props.slug = slug.trim();
    this.touch();
  }

  public addTag(tagId: UniqueEntityID): void {
    if (!this.hasTag(tagId)) {
      this.props.tagIds.push(tagId);
      this.touch();
    }
  }

  public removeTag(tagId: UniqueEntityID): void {
    const index = this.props.tagIds.findIndex((id) => id.equals(tagId));
    if (index >= 0) {
      this.props.tagIds.splice(index, 1);
      this.touch();
    }
  }

  public clearTags(): void {
    if (this.props.tagIds.length > 0) {
      this.props.tagIds = [];
      this.touch();
    }
  }

  public setTags(tagIds: UniqueEntityID[]): void {
    this.props.tagIds = [...tagIds];
    this.touch();
  }

  public markAsExported(): void {
    this.props.exportedAt = new Date();
    this.touch();
  }

  public setImportBatchId(batchId: string): void {
    // TODO: Implementar validação do importBatchId quando definida
    this.props.importBatchId = batchId;
    this.touch();
  }

  public update(
    props: Partial<{
      question: FlashcardContentVO;
      answer: FlashcardContentVO;
      slug: string;
    }>,
  ): void {
    if (props.question) {
      this.updateQuestion(props.question);
    }
    if (props.answer) {
      this.updateAnswer(props.answer);
    }
    if (props.slug) {
      this.updateSlug(props.slug);
    }
  }

  public toResponseObject(): {
    id: string;
    slug: string;
    question: {
      type: string;
      content: string;
    };
    answer: {
      type: string;
      content: string;
    };
    argumentId: string;
    tagIds: string[];
    importBatchId?: string;
    exportedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      slug: this.slug,
      question: {
        type: this.question.getType().getValue(),
        content: this.question.getContent(),
      },
      answer: {
        type: this.answer.getType().getValue(),
        content: this.answer.getContent(),
      },
      argumentId: this.argumentId.toString(),
      tagIds: this.tagIds.map((id) => id.toString()),
      importBatchId: this.importBatchId,
      exportedAt: this.exportedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
