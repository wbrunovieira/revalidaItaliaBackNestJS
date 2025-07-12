// ─────────────────────────────────────────────────────────────────
// src/domain/course-catalog/enterprise/entities/video.entity.ts
// ─────────────────────────────────────────────────────────────────
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { VideoTranslationVO } from '../value-objects/video-translation.vo';

export interface VideoProps {
  slug: string;
  imageUrl?: string;
  providerVideoId: string;
  durationInSeconds: number;
  lessonId?: string;
  translations: VideoTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export class Video extends Entity<VideoProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public get providerVideoId(): string {
    return this.props.providerVideoId;
  }

  public get durationInSeconds(): number {
    return this.props.durationInSeconds;
  }

  public get lessonId(): string | undefined {
    return this.props.lessonId;
  }

  public get translations(): VideoTranslationVO[] {
    return this.props.translations;
  }

  public get title(): string {
    // Retorna o título em português por padrão
    const ptTranslation = this.props.translations.find(
      (t) => t.locale === 'pt',
    );
    return ptTranslation?.title || '';
  }

  public isSeen(userId?: string): boolean {
    // Por enquanto retorna false, pois precisaria consultar a tabela VideoSeen
    // Isso seria implementado no repository/service layer
    return false;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateDetails(updates: {
    slug?: string;
    imageUrl?: string;
    durationInSeconds?: number;
    providerVideoId?: string;
  }) {
    if (updates.slug) {
      this.props.slug = updates.slug;
      this.touch();
    }
    if (updates.imageUrl !== undefined) {
      this.props.imageUrl = updates.imageUrl;
      this.touch();
    }
    if (typeof updates.durationInSeconds === 'number') {
      this.props.durationInSeconds = updates.durationInSeconds;
      this.touch();
    }
    if (updates.providerVideoId) {
      this.props.providerVideoId = updates.providerVideoId;
      this.touch();
    }
  }

  public updateTranslations(translations: VideoTranslationVO[]) {
    this.props.translations = translations;
    this.touch();
  }

  public updateLessonId(lessonId: string | undefined) {
    this.props.lessonId = lessonId;
    this.touch();
  }

  public toResponseObject(): {
    id: string;
    slug: string;
    imageUrl?: string;
    providerVideoId: string;
    durationInSeconds: number;
    lessonId?: string;
    translations: VideoTranslationVO[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      slug: this.slug,
      imageUrl: this.props.imageUrl,
      providerVideoId: this.props.providerVideoId,
      durationInSeconds: this.props.durationInSeconds,
      lessonId: this.props.lessonId,
      translations: this.props.translations,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<VideoProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Video {
    const now = new Date();
    return new Video(
      {
        slug: props.slug,
        imageUrl: props.imageUrl,
        providerVideoId: props.providerVideoId,
        durationInSeconds: props.durationInSeconds,
        lessonId: props.lessonId,
        translations: props.translations,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: VideoProps, id: UniqueEntityID): Video {
    return new Video(props, id);
  }
}
