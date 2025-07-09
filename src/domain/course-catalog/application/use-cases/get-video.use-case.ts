// src/domain/course-catalog/application/use-cases/get-video.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IVideoRepository } from '../repositories/i-video-repository';
import { GetVideoRequest } from '../dtos/get-video-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { getVideoSchema, GetVideoSchema } from './validations/get-video.schema';

export type GetVideoUseCaseResponse = Either<
  InvalidInputError | VideoNotFoundError | RepositoryError,
  {
    video: {
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
    };
  }
>;

@Injectable()
export class GetVideoUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(request: GetVideoRequest): Promise<GetVideoUseCaseResponse> {
    // valida input
    const parsed = getVideoSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const { id } = parsed.data;
    console.log('usecase get video:', parsed.data);

    // busca no repo
    try {
      const found = await this.videoRepo.findById(id);
      if (found.isLeft()) {
        return left(new VideoNotFoundError());
      }
      const { video, translations } = found.value;
      return right({
        video: {
          id: video.id.toString(),
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          translations,
        },
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
