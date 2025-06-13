
// src/domain/course-catalog/application/use-cases/get-track.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetTrackUseCase } from '@/domain/course-catalog/application/use-cases/get-track.use-case';
import { InMemoryTrackRepository } from '@/test/repositories/in-memory-track-repository';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { TrackNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/track-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('GetTrackUseCase', () => {
  let repo: InMemoryTrackRepository;
  let useCase: GetTrackUseCase;

  beforeEach(() => {
    repo = new InMemoryTrackRepository();
    useCase = new GetTrackUseCase(repo as any);
  });

  it('returns track payload with all translations on success', async () => {
    const translations = [
      new TrackTranslationVO('pt', 'Título PT', 'Descrição PT'),
      new TrackTranslationVO('it', 'Titolo IT', 'Descrizione IT'),
      new TrackTranslationVO('es', 'Título ES', 'Descripción ES'),
    ];
    const trackEntity = Track.create({
      slug: 'slug-track',
      courseIds: ['c1', 'c2'],
      translations,
    }, new UniqueEntityID('00000000-0000-0000-0000-000000000001'));
    repo.items.push(trackEntity);

    const result = await useCase.execute({ id: trackEntity.id.toString() });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const { track } = result.value;
      expect(track.id).toBe(trackEntity.id.toString());
      expect(track.slug).toBe('slug-track');
      expect(track.courseIds).toEqual(['c1', 'c2']);

      expect(Array.isArray(track.translations)).toBe(true);
      expect(track.translations).toHaveLength(3);
      expect(track.translations).toEqual(
        expect.arrayContaining([
          { locale: 'pt', title: 'Título PT', description: 'Descrição PT' },
          { locale: 'it', title: 'Titolo IT', description: 'Descrizione IT' },
          { locale: 'es', title: 'Título ES', description: 'Descripción ES' },
        ])
      );
    }
  });

  it('throws InvalidInputError for invalid UUID', async () => {
    const result = await useCase.execute({ id: 'not-a-uuid' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      const err = result.value as InvalidInputError;
      expect(err.details.some(d => d.path.join('.') === 'id')).toBe(true);
    }
  });

  it('throws TrackNotFoundError when repository returns not found', async () => {
    const id = '00000000-0000-0000-0000-000000000002';
    const result = await useCase.execute({ id });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(TrackNotFoundError);
    }
  });

  it('throws RepositoryError when repository throws', async () => {
    const id = '00000000-0000-0000-0000-000000000003';
    vi.spyOn(repo, 'findById').mockImplementationOnce(() => { throw new Error('DB crashed'); });
    const result = await useCase.execute({ id });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('DB crashed');
    }
  });
});

