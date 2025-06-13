// src/domain/course-catalog/application/use-cases/list-tracks.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from './errors/repository-error';
import { ITrackRepository } from '../repositories/i-track-repository';

export type ListTracksResponse = Either<
  RepositoryError,
  { tracks: { id: string; slug: string; courseIds: string[]; translations: { locale: 'pt' | 'it' | 'es'; title: string; description: string; }[]; }[] }
>;

@Injectable()
export class ListTracksUseCase {
  constructor(
    @Inject('TrackRepository')
    private readonly trackRepo: ITrackRepository,
  ) {}

  async execute(): Promise<ListTracksResponse> {
    try {
      const result = await this.trackRepo.findAll();
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message));
      }
      const tracks = result.value.map(t => ({
        id: t.id.toString(),
        slug: t.slug,
        courseIds: t.courseIds,
        translations: t.translations.map(tr => ({
          locale: tr.locale,
          title: tr.title,
          description: tr.description,
        })),
      }));
      return right({ tracks });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}