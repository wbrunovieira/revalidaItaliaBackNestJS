import { Either } from '@/core/either';
import { VideoTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/video-translation.vo';
import { InvalidInputError } from '../use-cases/errors/invalid-input-error';
import { VideoNotFoundError } from '../use-cases/errors/video-not-found-error';
import { DuplicateVideoError } from '../use-cases/errors/duplicate-video-error';
import { LessonNotFoundError } from '../use-cases/errors/lesson-not-found-error';
import { RepositoryError } from '../use-cases/errors/repository-error';

export interface UpdateVideoUseCaseRequest {
  videoId: string;
  slug?: string;
  imageUrl?: string | null;
  providerVideoId?: string;
  durationInSeconds?: number;
  lessonId?: string | null;
  translations?: {
    locale: string;
    title: string;
    description: string;
  }[];
}

export type UpdateVideoUseCaseResponse = Either<
  | InvalidInputError
  | VideoNotFoundError
  | DuplicateVideoError
  | LessonNotFoundError
  | RepositoryError,
  {
    message: string;
  }
>;
