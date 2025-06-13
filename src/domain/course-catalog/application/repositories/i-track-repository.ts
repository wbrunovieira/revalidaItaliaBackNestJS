// src/domain/course-catalog/application/repositories/i-track-repository.ts
import { Either } from "@/core/either";
import { Track } from "@/domain/course-catalog/enterprise/entities/track.entity";

export abstract class ITrackRepository {
  abstract findBySlug(slug: string): Promise<Either<Error, Track>>;
  abstract findById(id: string): Promise<Either<Error, Track>>;
  abstract create(track: Track): Promise<Either<Error, void>>;
  abstract findAll(): Promise<Either<Error, Track[]>>;
}