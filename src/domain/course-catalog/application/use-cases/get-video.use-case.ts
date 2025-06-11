// src/domain/course-catalog/application/use-cases/get-video.use-case.ts
import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";
import { IVideoRepository } from "../repositories/i-video-repository";
import { GetVideoRequest } from "../dtos/get-video-request.dto";
import { InvalidInputError } from "./errors/invalid-input-error";
import { VideoNotFoundError } from "./errors/video-not-found-error";
import { RepositoryError } from "./errors/repository-error";
import { GetVideoSchema, getVideoSchema } from "./validations/get-video.schema";


type GetVideoUseCaseResponse = Either<
  | InvalidInputError
  | VideoNotFoundError
  | RepositoryError
  | Error,
  {
    video: {
      id: string;
      slug: string;
      providerVideoId: string;
      durationInSeconds: number;
      createdAt: Date;
      updatedAt: Date;
      translations: Array<{
        locale: "pt" | "it" | "es";
        title: string;
        description: string;
      }>;
    };
  }
>;

@Injectable()
export class GetVideoUseCase {
  constructor(
    @Inject("VideoRepository")
    private readonly videoRepository: IVideoRepository
  ) {}

  async execute(
    request: GetVideoRequest
  ): Promise<GetVideoUseCaseResponse> {
    // 1) validação do input
    const parseResult = getVideoSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError("Validation failed", details));
    }
    const data: GetVideoSchema = parseResult.data;
    const videoId = data.id;

    // 2) busca no repositório
    try {
      const foundOrError = await this.videoRepository.findById(videoId);
      if (foundOrError.isLeft()) {
        return left(new VideoNotFoundError());
      }

      // 3) destrutura o objeto retornado pelo repositório
      const { video: v, translations } = foundOrError.value;

      // 4) monta e retorna o payload completo, incluindo todas as traduções
      return right({
        video: {
          id: v.id.toString(),
          slug: v.slug,
          providerVideoId: v.providerVideoId,
          durationInSeconds: v.durationInSeconds,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          translations: translations.map((tr) => ({
            locale: tr.locale,
            title: tr.title,
            description: tr.description,
          })),
        },
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}