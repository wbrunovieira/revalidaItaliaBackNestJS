// src/domain/course-catalog/application/use-cases/list-videos.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { IVideoRepository } from '../repositories/i-video-repository';
import { ListVideosRequest } from '../dtos/list-videos-request.dto';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';

import {
  listVideosSchema,
  ListVideosSchema,
} from './validations/list-videos.schema';

export type ListVideosUseCaseResponse = Either<
  InvalidInputError | RepositoryError,
  {
    videos: Array<{
      id: string;
      slug: string;
      providerVideoId: string;
      durationInSeconds: number;
      createdAt: Date;
      updatedAt: Date;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }>;
    }>;
  }
>;

@Injectable()
export class ListVideosUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(
    request: ListVideosRequest,
  ): Promise<ListVideosUseCaseResponse> {
    // 1) valida input
    const parsed = listVideosSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const { lessonId } = parsed.data as ListVideosSchema;

    // 2) busca vídeos da aula
    try {
      const foundOrErr = await this.videoRepo.findByLesson(lessonId);
      if (foundOrErr.isLeft()) {
        return left(new RepositoryError(foundOrErr.value.message));
      }

      // 3) formata resposta
      return right({
        videos: foundOrErr.value.map(({ video, translations }) => ({
          id: video.id.toString(),
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          translations,
        })),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
