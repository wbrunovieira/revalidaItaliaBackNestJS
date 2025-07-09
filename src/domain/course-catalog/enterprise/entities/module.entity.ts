// src/domain/course-catalog/enterprise/entities/module.entity.ts

import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Video } from './video.entity';

export interface ModuleTranslationVO {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface ModuleProps {
  slug: string;
  imageUrl?: string;
  translations: ModuleTranslationVO[];
  order: number;
  videos: Video[];
  createdAt: Date;
  updatedAt: Date;
}

export class Module extends Entity<ModuleProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public updateImageUrl(imageUrl: string): void {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  public removeImage(): void {
    this.props.imageUrl = undefined;
    this.touch();
  }

  public get translations(): ModuleTranslationVO[] {
    return this.props.translations;
  }

  public get title(): string {
    const pt = this.props.translations.find((t) => t.locale === 'pt')!;
    return pt.title;
  }

  public get order(): number {
    return this.props.order;
  }

  public get videos(): Video[] {
    return this.props.videos;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateDetails(updates: {
    title?: string;
    order?: number;
    slug?: string;
  }) {
    let touched = false;

    if (updates.slug) {
      this.props.slug = updates.slug;
      touched = true;
    }

    if (updates.title) {
      const ptIndex = this.props.translations.findIndex(
        (t) => t.locale === 'pt',
      );
      if (ptIndex >= 0) {
        this.props.translations[ptIndex].title = updates.title;
        touched = true;
      }
    }

    if (typeof updates.order === 'number') {
      this.props.order = updates.order;
      touched = true;
    }

    if (touched) this.touch();
  }

  public addVideo(video: Video) {
    this.props.videos.push(video);
    this.touch();
  }

  public removeVideo(videoId: string) {
    this.props.videos = this.props.videos.filter(
      (v) => v.id.toString() !== videoId,
    );
    this.touch();
  }

  public toResponseObject(): {
    id: string;
    slug: string;
    imageUrl?: string;
    title: string;
    order: number;
    videos: { id: string; title: string; isSeen: boolean }[];
    createdAt: Date;
    updatedAt: Date;
  } {
    const videoSummaries = this.props.videos.map((vid) => ({
      id: vid.id.toString(),
      title: vid.title,
      isSeen: vid.isSeen(), // chama o método para obter boolean
    }));

    return {
      id: this.id.toString(),
      slug: this.slug,
      imageUrl: this.imageUrl,
      title: this.title,
      order: this.props.order,
      videos: videoSummaries,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<ModuleProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Module {
    const now = new Date();
    return new Module(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: ModuleProps, id: UniqueEntityID): Module {
    return new Module(props, id);
  }
}
