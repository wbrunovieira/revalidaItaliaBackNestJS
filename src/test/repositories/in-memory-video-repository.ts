// src/test/repositories/in-memory-video-repository.ts
import { Either, left, right } from '@/core/either';
import { VideoDependencyInfo } from '@/domain/course-catalog/application/dtos/video-dependencies.dto';
import { IVideoRepository } from '@/domain/course-catalog/application/repositories/i-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';

interface StoredVideo {
  lessonId: string;
  video: Video;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }>;
}

interface VideoDependencies {
  videosSeen?: Array<{
    id: string;
    userId: string;
    userName: string;
    seenAt: Date;
  }>;
  translations?: Array<{ id: string; locale: string; title: string }>;
  videoLinks?: Array<{ id: string; locale: string; streamUrl: string }>;
}

export class InMemoryVideoRepository implements IVideoRepository {
  public items: StoredVideo[] = [];
  private dependencies: Map<string, VideoDependencies> = new Map();

  async findBySlug(slug: string): Promise<Either<Error, Video>> {
    const found = this.items.find((entry) => entry.video.slug === slug);
    return found ? right(found.video) : left(new Error('Video not found'));
  }

  async findById(id: string): Promise<
    Either<
      Error,
      {
        video: Video;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }
    >
  > {
    const found = this.items.find((entry) => entry.video.id.toString() === id);
    if (!found) {
      return left(new Error('Video not found'));
    }
    return right({ video: found.video, translations: found.translations });
  }

  async create(
    lessonId: string,
    video: Video,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>,
  ): Promise<Either<Error, void>> {
    this.items.push({ lessonId, video, translations });
    return right(undefined);
  }

  async findByLesson(lessonId: string): Promise<
    Either<
      Error,
      Array<{
        video: Video;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }>
    >
  > {
    const filtered = this.items.filter((item) => item.lessonId === lessonId);
    return right(
      filtered.map((item) => ({
        video: item.video,
        translations: item.translations,
      })),
    );
  }

  async checkVideoDependencies(
    id: string,
  ): Promise<Either<Error, VideoDependencyInfo>> {
    try {
      const deps = this.dependencies.get(id) || {};
      const dependencies: VideoDependencyInfo['dependencies'] = [];

      // Verificar videosSeen
      if (deps.videosSeen?.length) {
        deps.videosSeen.forEach((seen) => {
          dependencies.push({
            type: 'video_seen',
            id: seen.id,
            name: `Viewed by ${seen.userName}`,
            relatedEntities: {
              userId: seen.userId,
              userName: seen.userName,
            },
          });
        });
      }

      // Verificar translations
      if (deps.translations?.length) {
        deps.translations.forEach((translation) => {
          dependencies.push({
            type: 'translation',
            id: translation.id,
            name: `Translation (${translation.locale}): ${translation.title}`,
            relatedEntities: {
              locale: translation.locale,
            },
          });
        });
      }

      // Verificar videoLinks
      if (deps.videoLinks?.length) {
        deps.videoLinks.forEach((link) => {
          dependencies.push({
            type: 'video_link',
            id: link.id,
            name: `Video Link (${link.locale})`,
            relatedEntities: {
              locale: link.locale,
            },
          });
        });
      }

      const info: VideoDependencyInfo = {
        canDelete: dependencies.length === 0,
        totalDependencies: dependencies.length,
        summary: {
          videosSeen: deps.videosSeen?.length || 0,
          translations: deps.translations?.length || 0,
          videoLinks: deps.videoLinks?.length || 0,
        },
        dependencies,
      };

      return right(info);
    } catch (err: any) {
      return left(
        new Error(`Failed to check video dependencies: ${err.message}`),
      );
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      const index = this.items.findIndex(
        (item) => item.video.id.toString() === id,
      );
      if (index === -1) {
        return left(new Error('Video not found'));
      }

      this.items.splice(index, 1);
      this.dependencies.delete(id);
      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to delete video: ${err.message}`));
    }
  }

  // Métodos auxiliares para testes
  addDependenciesToVideo(videoId: string, deps: VideoDependencies) {
    this.dependencies.set(videoId, deps);
  }

  clearDependencies() {
    this.dependencies.clear();
  }
}
