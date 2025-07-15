import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface FlashcardTagProps {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FlashcardTag extends Entity<FlashcardTagProps> {
  private constructor(props: FlashcardTagProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: Omit<FlashcardTagProps, 'createdAt' | 'updatedAt' | 'slug'> & {
      slug?: string;
    },
    id?: UniqueEntityID,
  ): FlashcardTag {
    const now = new Date();
    
    // Validações
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (props.name.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }

    // Auto-generate slug if not provided
    const slug = props.slug || FlashcardTag.generateSlug(props.name);

    return new FlashcardTag(
      {
        ...props,
        name: props.name.trim(),
        slug,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: FlashcardTagProps,
    id: UniqueEntityID,
  ): FlashcardTag {
    return new FlashcardTag(props, id);
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início e fim
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // Getters
  public get name(): string {
    return this.props.name;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  public matchesName(name: string): boolean {
    return this.props.name.toLowerCase() === name.toLowerCase();
  }

  public matchesSlug(slug: string): boolean {
    return this.props.slug === slug;
  }

  public containsKeyword(keyword: string): boolean {
    return this.props.name.toLowerCase().includes(keyword.toLowerCase());
  }

  // Update Methods
  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    if (name.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }

    this.props.name = name.trim();
    this.props.slug = FlashcardTag.generateSlug(name);
    this.touch();
  }

  public updateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Slug cannot be empty');
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    this.props.slug = slug.trim();
    this.touch();
  }

  public update(props: Partial<{
    name: string;
    slug: string;
  }>): void {
    if (props.name) {
      this.updateName(props.name);
    }
    if (props.slug) {
      this.updateSlug(props.slug);
    }
  }

  public toResponseObject(): {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      name: this.name,
      slug: this.slug,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}