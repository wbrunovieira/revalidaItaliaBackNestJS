// src/domain/course-catalog/application/use-cases/get-videos.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IVideoRepository } from '../repositories/i-video-repository';
import { GetVideosRequest } from '../dtos/get-videos-request.dto';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { GetVideosSchema, getVideosSchema } from './validations/get-videos.schema';

export type GetVideosUseCaseResponse = Either<
  | InvalidInputError
  | RepositoryError
  | Error,
  { videos: Array<{
      id: string;
      slug: string;
      providerVideoId: string;
      durationInSeconds: number;
      createdAt: Date;
      updatedAt: Date;
      translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>;
    }> }
>;

@Injectable()
export class GetVideosUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(
    request: GetVideosRequest,
  ): Promise<GetVideosUseCaseResponse> {
    const parsed = getVideosSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => ({ code: i.code, message: i.message, path: i.path }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data: GetVideosSchema = parsed.data;

    try {
      const found = await this.videoRepo.findByModule(data.moduleId);
      if (found.isLeft()) {
        return left(new RepositoryError(found.value.message));
      }
      const list = found.value;
      return right({ videos: list.map(({ video, translations }) => ({
        id: video.id.toString(),
        slug: video.slug,
        providerVideoId: video.providerVideoId,
        durationInSeconds: video.durationInSeconds,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        translations,
      })) });
    } catch(err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
