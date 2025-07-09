import { Either } from '@/core/either';
import { Video } from '../../enterprise/entities/video.entity';
import { VideoDependencyInfo } from '../dtos/video-dependencies.dto';

// src/domain/course-catalog/application/repositories/i-video-repository.ts
export interface IVideoRepository {
  findBySlug(slug: string): Promise<Either<Error, Video>>;
  create(
    moduleId: string,
    video: Video,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>,
  ): Promise<Either<Error, void>>;

  findById(id: string): Promise<
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
  >;

  findByLesson(lessonId: string): Promise<
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
  >;

  checkVideoDependencies(
    id: string,
  ): Promise<Either<Error, VideoDependencyInfo>>;
  delete(id: string): Promise<Either<Error, void>>;
  update(video: Video): Promise<Either<Error, void>>;
}
