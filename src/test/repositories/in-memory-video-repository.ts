
// src/test/repositories/in-memory-video-repository.ts
import { Either, left, right } from '@/core/either';
import { IVideoRepository } from '@/domain/course-catalog/application/repositories/i-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';

interface StoredVideo {
  lessonId: string;
  video: Video;
  translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>;
}

export class InMemoryVideoRepository implements IVideoRepository {
  public items: StoredVideo[] = [];

  async findBySlug(
    slug: string
  ): Promise<Either<Error, Video>> {
    const found = this.items.find(entry => entry.video.slug === slug);
    return found ? right(found.video) : left(new Error('Video not found'));
  }

  async findById(
    id: string
  ): Promise<
    Either<
      Error,
      {
        video: Video;
        translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>;
      }
    >
  > {
    const found = this.items.find(entry => entry.video.id.toString() === id);
    if (!found) {
      return left(new Error('Video not found'));
    }
    return right({ video: found.video, translations: found.translations });
  }

  async create(
    lessonId: string,
    video: Video,
    translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>
  ): Promise<Either<Error, void>> {
    this.items.push({ lessonId, video, translations });
    return right(undefined);
  }

  async findByLesson(
    lessonId: string,
  ): Promise<Either<Error, Array<{ video: Video; translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }> }>>> {
    const filtered = this.items.filter(item => item.lessonId === lessonId);
    return right(filtered.map(item => ({ video: item.video, translations: item.translations })));
  }

}
