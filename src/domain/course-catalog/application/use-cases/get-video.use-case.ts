import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IVideoRepository } from '../repositories/i-video-repository';
import { GetVideoRequest } from '../dtos/get-video-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { GetVideoSchema, getVideoSchema } from './validations/get-video.schema';


type GetVideoUseCaseResponse = Either<
  | InvalidInputError
  | VideoNotFoundError
  | RepositoryError
  | Error,
  {
    video: {
      id: string;
      slug: string;
      title: string;
      providerVideoId: string;
      durationInSeconds: number;
      createdAt: Date;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class GetVideoUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepository: IVideoRepository,
  ) {}

  async execute(
    request: GetVideoRequest
  ): Promise<GetVideoUseCaseResponse> {
    // 1) validar input
    const parseResult = getVideoSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map(issue => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data: GetVideoSchema = parseResult.data;
    const videoId = data.id;

    // 2) buscar no repositório
    try {
      const found = await this.videoRepository.findById(videoId);
      if (found.isLeft()) {
        return left(new VideoNotFoundError());
      }
      const videoEntity = found.value;

      // 3) montar payload
      const payload = {
        video: {
          id: videoEntity.id.toString(),
          slug: videoEntity.slug,
          title: videoEntity.title,
          providerVideoId: videoEntity.providerVideoId,
          durationInSeconds: videoEntity.durationInSeconds,
          createdAt: videoEntity.createdAt,
          updatedAt: videoEntity.updatedAt,
        },
      };
      return right(payload);
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}