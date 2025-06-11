// src/test/repositories/in-memory-video-repository.ts
import { Either, left, right } from '@/core/either';
import { IVideoRepository } from '@/domain/course-catalog/application/repositories/i-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';

interface StoredVideo {
  moduleId: string;
  video: Video;
}

export class InMemoryVideoRepository implements IVideoRepository {
  public items: StoredVideo[] = [];

  async findBySlug(slug: string): Promise<Either<Error, Video>> {
    const found = this.items.find((entry) => entry.video.slug === slug);
    return found ? right(found.video) : left(new Error('Video not found'));
  }

  async create(
    moduleId: string,
    video: Video
  ): Promise<Either<Error, void>> {
    this.items.push({ moduleId, video });
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Video>> {
    const found = this.items.find(entry => entry.video.id.toString() === id);
    return found ? right(found.video) : left(new Error('Video not found'));
  }
}