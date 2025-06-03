// src/domain/course-catalog/enterprise/entities/module.entity.ts
import { Entity } from "@/core/entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { Video } from "./video.entity";

export interface ModuleProps {
  title: string;
  order: number;       
  videos: Video[];     
  createdAt: Date;
  updatedAt: Date;
}

export class Module extends Entity<ModuleProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }
  public get moduleId(): string {
    return this.id.toString();
  }

  public get title(): string {
    return this.props.title;
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
  }) {
    if (updates.title) {
      this.props.title = updates.title;
      this.touch();
    }
    if (typeof updates.order === "number") {
      this.props.order = updates.order;
      this.touch();
    }
  }

  public addVideo(video: Video) {
    this.props.videos.push(video);
    this.touch();
  }


  public removeVideo(videoId: string) {
    this.props.videos = this.props.videos.filter(
      (v) => v.id.toString() !== videoId
    );
    this.touch();
  }

  public toResponseObject(): {
    id: string;
    title: string;
    order: number;
    videos: { id: string; title: string; isSeen: boolean }[];
    createdAt: Date;
    updatedAt: Date;
  } {
    const videoSummaries = this.props.videos.map((vid) => ({
      id: vid.id.toString(),
      title: vid.title,
      isSeen: vid.isSeen,
    }));

    return {
      id: this.id.toString(), 
      title: this.props.title,
      order: this.props.order,
      videos: videoSummaries,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<ModuleProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ) {
    const now = new Date();
    return new Module(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}