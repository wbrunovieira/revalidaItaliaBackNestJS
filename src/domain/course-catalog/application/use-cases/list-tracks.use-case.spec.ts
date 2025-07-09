// src/domain/course-catalog/application/use-cases/list-tracks.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ListTracksUseCase,
  ListTracksResponse,
} from '@/domain/course-catalog/application/use-cases/list-tracks.use-case';
import { InMemoryTrackRepository } from '@/test/repositories/in-memory-track-repository';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { left } from '@/core/either';

describe('ListTracksUseCase', () => {
  let repo: InMemoryTrackRepository;
  let useCase: ListTracksUseCase;

  beforeEach(() => {
    repo = new InMemoryTrackRepository();
    useCase = new ListTracksUseCase(repo as any);
  });

  it('returns empty list when no tracks', async () => {
    const result = await useCase.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.tracks).toEqual([]);
    }
  });

  it('returns list of tracks on success', async () => {
    // Seed two tracks
    const t1 = Track.create(
      {
        slug: 's1',
        courseIds: ['c1'],
        translations: [new TrackTranslationVO('pt', 'T1', 'D1')],
      },
      new UniqueEntityID('id1'),
    );
    const t2 = Track.create(
      {
        slug: 's2',
        courseIds: ['c2'],
        translations: [new TrackTranslationVO('pt', 'T2', 'D2')],
      },
      new UniqueEntityID('id2'),
    );
    repo.items.push(t1, t2);

    const result = await useCase.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const { tracks } = result.value;
      expect(tracks).toHaveLength(2);
      expect(tracks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'id1',
            slug: 's1',
            courseIds: ['c1'],
            translations: expect.any(Array),
          }),
          expect.objectContaining({
            id: 'id2',
            slug: 's2',
            courseIds: ['c2'],
            translations: expect.any(Array),
          }),
        ]),
      );
    }
  });

  it('handles repository left as error', async () => {
    vi.spyOn(repo, 'findAll').mockResolvedValueOnce(
      left(new Error('fail')) as any,
    );
    const result = await useCase.execute();
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('fail');
    }
  });

  it('handles exception thrown by repo', async () => {
    vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
      throw new Error('crash');
    });
    const result = await useCase.execute();
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('crash');
    }
  });
});
