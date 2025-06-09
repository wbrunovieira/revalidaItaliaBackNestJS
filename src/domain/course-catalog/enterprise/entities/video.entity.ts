// ─────────────────────────────────────────────────────────────────
// src/domain/course-catalog/enterprise/entities/video.entity.ts
// ─────────────────────────────────────────────────────────────────
import { Entity } from "@/core/entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

export interface VideoProps {
  slug: string;

  title: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
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

  public get title(): string {
    return this.props.title;
  }

  public get providerVideoId(): string {
    return this.props.providerVideoId;
  }

  public get durationInSeconds(): number {
    return this.props.durationInSeconds;
  }

  public get isSeen(): boolean {
    return this.props.isSeen;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateDetails(updates: { title?: string; durationInSeconds?: number; slug?: string }) {
    if (updates.slug) {
      this.props.slug = updates.slug;
      this.touch();
    }
    if (updates.title) {
      this.props.title = updates.title;
      this.touch();
    }
    if (typeof updates.durationInSeconds === "number") {
      this.props.durationInSeconds = updates.durationInSeconds;
      this.touch();
    }
  }

  public markAsSeen() {
    if (!this.props.isSeen) {
      this.props.isSeen = true;
      this.touch();
    }
  }

  public markAsUnseen() {
    if (this.props.isSeen) {
      this.props.isSeen = false;
      this.touch();
    }
  }

  public toResponseObject(): {
    id: string;
    slug: string;
    title: string;
    providerVideoId: string;
    durationInSeconds: number;
    isSeen: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      slug: this.slug,
      title: this.props.title,
      providerVideoId: this.props.providerVideoId,
      durationInSeconds: this.props.durationInSeconds,
      isSeen: this.props.isSeen,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<VideoProps, "createdAt" | "updatedAt" | "isSeen"> & { isSeen?: boolean },
    id?: UniqueEntityID
  ): Video {
    const now = new Date();
    return new Video(
      {
        slug: props.slug,
        title: props.title,
        providerVideoId: props.providerVideoId,
        durationInSeconds: props.durationInSeconds,
        isSeen: props.isSeen ?? false,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  public static reconstruct(props: VideoProps, id: UniqueEntityID): Video {
    return new Video(props, id);
  }
}