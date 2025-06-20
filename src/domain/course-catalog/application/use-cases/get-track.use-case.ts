// src/domain/course-catalog/application/use-cases/get-track.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { GetTrackRequest } from '../dtos/get-track-request.dto';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { TrackNotFoundError } from './errors/track-not-found-error';
import { ITrackRepository } from '../repositories/i-track-repository';
import { GetTrackSchema, getTrackSchema } from './validations/get-track.schema';

export type GetTrackResponse = Either<
  InvalidInputError | TrackNotFoundError | RepositoryError,
  {
    track: {
      id: string;
      slug: string;
      imageUrl?: string;
      courseIds: string[];
      translations: {
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }[];
    };
  }
>;

@Injectable()
export class GetTrackUseCase {
  constructor(
    @Inject('TrackRepository')
    private readonly trackRepo: ITrackRepository,
  ) {}

  async execute(request: GetTrackRequest): Promise<GetTrackResponse> {
    // Validate
    const parse = getTrackSchema.safeParse(request);
    if (!parse.success) {
      const details = parse.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const { id } = parse.data as GetTrackSchema;

    // Fetch from repo
    let found;
    try {
      found = await this.trackRepo.findById(id);
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    if (found.isLeft()) {
      const err = found.value;
      // Not found
      if (err.message.toLowerCase().includes('not found')) {
        return left(new TrackNotFoundError());
      }
      // Other repo error
      return left(new RepositoryError(err.message));
    }

    const trackEntity = found.value;
    const payload = {
      track: {
        id: trackEntity.id.toString(),
        slug: trackEntity.slug,
        imageUrl: trackEntity.imageUrl,
        courseIds: trackEntity.courseIds,
        // Exponha tudo:
        translations: trackEntity.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
        })),
      },
    };
    return right(payload);
  }
}
