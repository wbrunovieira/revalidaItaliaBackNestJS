// src/domain/course-catalog/application/use-cases/create-track.use-case.ts
import { Either, left, right } from "@/core/either";
import { Inject, Injectable } from "@nestjs/common";
import { CreateTrackRequest } from "../dtos/create-track-request.dto";

import { InvalidInputError } from "./errors/invalid-input-error";
import { RepositoryError } from "./errors/repository-error";
import { DuplicateTrackError } from "./errors/duplicate-track-error";
import { Track } from "@/domain/course-catalog/enterprise/entities/track.entity";
import { SlugVO } from "@/domain/course-catalog/enterprise/value-objects/slug.vo";
import { TrackTranslationVO } from "@/domain/course-catalog/enterprise/value-objects/track-translation.vo";
import { ITrackRepository } from "../repositories/i-track-repository";
import { CreateTrackSchema, createTrackSchema } from "./validations/create-track.schema";

type CreateTrackResponse = Either<
  InvalidInputError | DuplicateTrackError | RepositoryError,
  { track: { id: string; slug: string; courseIds: string[]; title: string; description: string; } }
>;

@Injectable()
export class CreateTrackUseCase {
  constructor(
    @Inject("TrackRepository") private readonly trackRepo: ITrackRepository
  ) {}

  async execute(request: CreateTrackRequest): Promise<CreateTrackResponse> {
    const parse = createTrackSchema.safeParse(request);
    if (!parse.success) {
      const details = parse.error.issues.map(i => ({ code: i.code, message: i.message, path: i.path }));
      return left(new InvalidInputError("Validation failed", details));
    }
    const data = parse.data as CreateTrackSchema;

    try {
      const exists = await this.trackRepo.findBySlug(data.slug);
      if (exists.isRight()) return left(new DuplicateTrackError());
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    let slugVo: SlugVO;
    try {
      slugVo = SlugVO.create(data.slug);
    } catch (err: any) {
      return left(new InvalidInputError("Invalid slug", [{ message: err.message, path: ["slug"] }]));
    }

    const translations = data.translations.map(t => new TrackTranslationVO(t.locale, t.title, t.description));
    const track = Track.create({ slug: slugVo.get(), courseIds: data.courseIds, translations });

    try {
      const created = await this.trackRepo.create(track);
      if (created.isLeft()) return left(new RepositoryError(created.value.message));
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const payload = { id: track.id.toString(), slug: track.slug, courseIds: track.courseIds, title: track.title, description: track.description };
    return right({ track: payload });
  }
}