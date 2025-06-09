// src/domain/course-catalog/application/use-cases/create-video.use-case.ts

import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";
import { SlugVO } from "@/domain/course-catalog/enterprise/value-objects/slug.vo";
import { Module as ModuleEntity } from "@/domain/course-catalog/enterprise/entities/module.entity";
import { Video } from "@/domain/course-catalog/enterprise/entities/video.entity";
import { IModuleRepository } from "../repositories/i-module-repository";
import { IVideoRepository } from "../repositories/i-video-repository";
import { VideoHostProvider } from "../providers/video-host.provider";

import { InvalidInputError } from "./errors/invalid-input-error";
import { ModuleNotFoundError } from "./errors/module-not-found-error";
import { DuplicateVideoError } from "./errors/duplicate-video-error";
import { RepositoryError } from "./errors/repository-error";

import { createVideoSchema, CreateVideoSchema } from "./validations/create-video.schema";
import { CreateVideoRequest } from "../dtos/create-video-request.dto";

export type CreateVideoUseCaseResponse = Either<
  | InvalidInputError
  | ModuleNotFoundError
  | DuplicateVideoError
  | RepositoryError,
  {
    video: {
      id: string;
      slug: string;
      title: string;               // Portuguese title
      providerVideoId: string;
      durationInSeconds: number;
      isSeen: boolean;
    };
  }
>;

@Injectable()
export class CreateVideoUseCase {
  constructor(
    @Inject("ModuleRepository")
    private readonly moduleRepo: IModuleRepository,
    @Inject("VideoRepository")
    private readonly videoRepo: IVideoRepository,
    @Inject("VideoHostProvider")
    private readonly host: VideoHostProvider
  ) {}

  public async execute(
    request: CreateVideoRequest
  ): Promise<CreateVideoUseCaseResponse> {
    // 1) Validate input
    const parsed = createVideoSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError("Validation failed", details));
    }
    const data = parsed.data as CreateVideoSchema;

    // 2) Ensure module exists
    const foundModule = await this.moduleRepo.findById(data.moduleId);
    if (foundModule.isLeft()) {
      return left(new ModuleNotFoundError());
    }

    // 3) Normalize & validate slug
    let slugVo: SlugVO;
    try {
      slugVo = SlugVO.create(data.slug);
    } catch (err: any) {
      return left(
        new InvalidInputError("Invalid slug", [
          { message: err.message, path: ["slug"] },
        ])
      );
    }
    const slug = slugVo.get();

    // 4) Check duplicate slug
    const maybeExisting = await this.videoRepo.findBySlug(slug);
    if (maybeExisting.isRight()) {
      return left(new DuplicateVideoError());
    }

    // 5) Fetch duration from host provider
    let durationInSeconds: number;
    try {
      const meta = await this.host.getMetadata(data.providerVideoId);
      durationInSeconds = meta.durationInSeconds;
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 6) Pick the Portuguese translation for the core entity
    const ptTranslation = data.translations.find((t) => t.locale === "pt")!;

    // 7) Build Video entity
    const videoEntity = Video.create({
      slug,
      title: ptTranslation.title,
      providerVideoId: data.providerVideoId,
      durationInSeconds,
    });

    // 8) Persist (pass all three translations to your repo)
    try {
      const created = await this.videoRepo.create(
        data.moduleId,
        videoEntity,
        data.translations
      );
      if (created.isLeft()) {
        return left(new RepositoryError(created.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 9) Return DTO (with Portuguese title)
    return right({
      video: {
        id: videoEntity.id.toString(),
        slug: videoEntity.slug,
        title: videoEntity.title,
        providerVideoId: videoEntity.providerVideoId,
        durationInSeconds: videoEntity.durationInSeconds,
        isSeen: videoEntity.isSeen,
      },
    });
  }
}