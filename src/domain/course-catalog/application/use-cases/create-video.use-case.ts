// src/domain/course-catalog/application/use-cases/create-video.use-case.ts

import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";

import { SlugVO } from "@/domain/course-catalog/enterprise/value-objects/slug.vo";
import { Video } from "@/domain/course-catalog/enterprise/entities/video.entity";


import { IVideoRepository } from "../repositories/i-video-repository";
import { VideoHostProvider } from "../providers/video-host.provider";

import { InvalidInputError } from "./errors/invalid-input-error";

import { DuplicateVideoError } from "./errors/duplicate-video-error";
import { RepositoryError } from "./errors/repository-error";

import {
  createVideoSchema,
  CreateVideoSchema,
} from "./validations/create-video.schema";

import { CreateVideoRequest } from "../dtos/create-video-request.dto";
import { LessonNotFoundError } from "./errors/lesson-not-found-error";
import { ILessonRepository } from "../repositories/i-lesson-repository";

export type CreateVideoUseCaseResponse = Either<
  | InvalidInputError
  | LessonNotFoundError
  | DuplicateVideoError
  | RepositoryError,
  {
    video: {
      id: string;
      slug: string;
      title: string;
      providerVideoId: string;
      durationInSeconds: number;
      isSeen: boolean;
    };
  }
>;

@Injectable()
export class CreateVideoUseCase {
  constructor(
    @Inject("LessonRepository") 
    private readonly lessonRepo: ILessonRepository,

    @Inject("VideoRepository") 
    private readonly videoRepo: IVideoRepository,

    @Inject("VideoHostProvider") 
    private readonly host: VideoHostProvider,
  ) {}

  async execute(
    request: CreateVideoRequest
  ): Promise<CreateVideoUseCaseResponse> {
    // 1) Validate DTO
    const parseResult = createVideoSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError("Validation failed", details));
    }
    const data = parseResult.data as CreateVideoSchema;

    // 2) Check that the lesson exists
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) Validate & normalize slug
    let slug: string;
    try {
      slug = SlugVO.create(data.slug).get();
    } catch (err: any) {
      return left(
        new InvalidInputError("Invalid slug", [
          { message: err.message, path: ["slug"] },
        ])
      );
    }

    // 4) Duplicate‐slug guard
    const existingOrErr = await this.videoRepo.findBySlug(slug);
    if (existingOrErr.isRight()) {
      return left(new DuplicateVideoError());
    }
    if (existingOrErr.isLeft() && existingOrErr.value.message !== "Video not found") {
      // some repository failure...
      return left(new RepositoryError(existingOrErr.value.message));
    }

    // 5) Fetch host metadata
    let durationInSeconds: number;
    try {
      const meta = await this.host.getMetadata(data.providerVideoId);
      durationInSeconds = meta.durationInSeconds;
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 6) Build our domain Video
    const ptTr = data.translations.find((t) => t.locale === "pt")!;
    const videoEntity = Video.create(
      {
        slug,
        title: ptTr.title,
        providerVideoId: data.providerVideoId,
        durationInSeconds,
      }
    );

    // 7) Persist under that lesson
    const saveOrErr = await this.videoRepo.create(
      data.lessonId,
      videoEntity,
      data.translations
    );
    if (saveOrErr.isLeft()) {
      return left(new RepositoryError(saveOrErr.value.message));
    }

    // 8) Return DTO view
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