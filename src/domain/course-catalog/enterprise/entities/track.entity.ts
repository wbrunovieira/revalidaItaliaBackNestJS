// src/domain/course-catalog/enterprise/entities/track.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';

export interface TrackProps {
  slug: string;
  imageUrl?: string;
  courseIds: string[];
  translations: TrackTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export class Track extends Entity<TrackProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public get courseIds(): string[] {
    return this.props.courseIds;
  }

  public get translations(): TrackTranslationVO[] {
    return this.props.translations;
  }

  public get title(): string {
    return this.props.translations.find((t) => t.locale === 'pt')!.title;
  }

  public get description(): string {
    return this.props.translations.find((t) => t.locale === 'pt')!.description;
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

  public static create(
    props: Omit<TrackProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Track {
    const now = new Date();
    return new Track(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: TrackProps, id: UniqueEntityID): Track {
    return new Track(props, id);
  }
}
