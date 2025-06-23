// ─────────────────────────────────────────────────────────────────
// src/domain/course-catalog/enterprise/entities/course.entity.ts
// ─────────────────────────────────────────────────────────────────
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface CourseTranslationVO {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface CourseProps {
  slug: string;
  imageUrl?: string;
  translations: CourseTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export class Course extends Entity<CourseProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public get translations(): CourseTranslationVO[] {
    return this.props.translations;
  }

  public get title(): string {
    const pt = this.props.translations.find((t) => t.locale === 'pt')!;
    return pt.title;
  }

  public get description(): string {
    const pt = this.props.translations.find((t) => t.locale === 'pt')!;
    return pt.description;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateImageUrl(imageUrl: string): void {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  public removeImage(): void {
    this.props.imageUrl = undefined;
    this.touch();
  }
  public updateDetails(updates: {
    title?: string;
    description?: string;
    slug?: string;
  }) {
    if (updates.slug) {
      this.props.slug = updates.slug;
      this.touch();
    }
    if (updates.title) {
      const ptIndex = this.props.translations.findIndex(
        (t) => t.locale === 'pt',
      );
      if (ptIndex >= 0) {
        this.props.translations[ptIndex].title = updates.title;
      }
      this.touch();
    }
    if (updates.description) {
      const ptIndex = this.props.translations.findIndex(
        (t) => t.locale === 'pt',
      );
      if (ptIndex >= 0) {
        this.props.translations[ptIndex].description = updates.description;
      }
      this.touch();
    }
  }

  public toResponseObject(): {
    id: string;
    slug: string;
    imageUrl?: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      slug: this.slug,
      imageUrl: this.imageUrl,
      title: this.title,
      description: this.description,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<CourseProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Course {
    const now = new Date();
    return new Course(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: CourseProps, id: UniqueEntityID): Course {
    return new Course(props, id);
  }
}
