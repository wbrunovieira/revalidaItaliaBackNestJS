import { Either } from "@/core/either";
import { Video } from "../../enterprise/entities/video.entity";

// src/domain/course-catalog/application/repositories/i-video-repository.ts
export interface IVideoRepository {
  findBySlug(slug: string): Promise<Either<Error, Video>>;
  create(
    moduleId: string,
    video: Video,
    translations: Array<{ locale: "pt"|"it"|"es"; title: string; description: string }>
  ): Promise<Either<Error, void>>;
}