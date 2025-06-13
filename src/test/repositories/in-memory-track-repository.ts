// src/test/repositories/in-memory-track-repository.ts
import { Either, left, right } from "@/core/either";
import { ITrackRepository } from "@/domain/course-catalog/application/repositories/i-track-repository";
import { Track } from "@/domain/course-catalog/enterprise/entities/track.entity";

export class InMemoryTrackRepository implements ITrackRepository {
  public items: Track[] = [];

  async findBySlug(slug: string): Promise<Either<Error, Track>> {
    const found = this.items.find(t => t.slug === slug);
    return found ? right(found) : left(new Error("Not found"));
  }

  async findById(id: string): Promise<Either<Error, Track>> {
    const found = this.items.find(t => t.id.toString() === id);
    return found ? right(found) : left(new Error("Not found"));
  }

  async create(track: Track): Promise<Either<Error, void>> {
    this.items.push(track);
    return right(undefined);
  }

  async findAll(): Promise<Either<Error, Track[]>> {
    return right(this.items);
  }
}