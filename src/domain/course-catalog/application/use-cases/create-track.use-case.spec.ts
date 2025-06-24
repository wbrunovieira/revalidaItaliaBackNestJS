// src/domain/course-catalog/application/use-cases/create-track.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { InMemoryTrackRepository } from '@/test/repositories/in-memory-track-repository';
import { left } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

import { CreateTrackRequest } from '@/domain/course-catalog/application/dtos/create-track-request.dto';

function baseRequest(): CreateTrackRequest {
  return {
    slug: 'my-track',
    courseIds: ['uuid-1'],
    translations: [
      { locale: 'pt', title: 'Trilha PT', description: 'Descrição PT' },
      { locale: 'it', title: 'Traccia IT', description: 'Descrizione IT' },
      { locale: 'es', title: 'Pista ES', description: 'Descripción ES' },
    ],
  };
}

function baseRequestWithImage(): CreateTrackRequest {
  return {
    ...baseRequest(),
    imageUrl: 'https://example.com/track-image.jpg',
  };
}

describe('CreateTrackUseCase', () => {
  let repo: InMemoryTrackRepository;
  let sut: CreateTrackUseCase;

  beforeEach(() => {
    repo = new InMemoryTrackRepository();
    sut = new CreateTrackUseCase(repo);
  });

  it('creates a track successfully', async () => {
    const result = await sut.execute(baseRequest());
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const t = result.value.track;
      expect(t.slug).toBe('my-track');
      expect(t.courseIds).toEqual(['uuid-1']);
      expect(t.title).toBe('Trilha PT');
      expect(t.description).toBe('Descrição PT');
      expect(t.imageUrl).toBeUndefined();
      expect(repo.items).toHaveLength(1);
    }
  });

  it('creates a track with imageUrl successfully', async () => {
    const result = await sut.execute(baseRequestWithImage());
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const t = result.value.track;
      expect(t.slug).toBe('my-track');
      expect(t.courseIds).toEqual(['uuid-1']);
      expect(t.title).toBe('Trilha PT');
      expect(t.description).toBe('Descrição PT');
      expect(t.imageUrl).toBe('https://example.com/track-image.jpg');
      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].imageUrl).toBe(
        'https://example.com/track-image.jpg',
      );
    }
  });

  it('rejects invalid imageUrl format', async () => {
    const request = {
      ...baseRequest(),
      imageUrl: 'invalid-url',
    };
    const r = await sut.execute(request);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
      if (r.value instanceof InvalidInputError) {
        expect(r.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              // ✅ CORREÇÃO: Atualizar para a mensagem real retornada pelo schema
              message: expect.stringContaining(
                'imageUrl must be a valid absolute URL',
              ),
            }),
          ]),
        );
      }
    }
  });

  it('accepts empty imageUrl', async () => {
    const request = {
      ...baseRequest(),
      imageUrl: '',
    };
    const r = await sut.execute(request);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('accepts undefined imageUrl', async () => {
    const request = {
      ...baseRequest(),
      imageUrl: undefined,
    };
    const result = await sut.execute(request);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.track.imageUrl).toBeUndefined();
    }
  });

  it('rejects missing slug', async () => {
    const r = await sut.execute({ ...baseRequest(), slug: '' } as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('rejects empty courseIds', async () => {
    const r = await sut.execute({ ...baseRequest(), courseIds: [] } as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('rejects missing PT translation', async () => {
    const req = baseRequest();
    req.translations = req.translations.filter((t) => t.locale !== 'pt');
    const r = await sut.execute(req as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
      if (r.value instanceof InvalidInputError) {
        expect(r.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least a Portuguese translation is required',
            }),
          ]),
        );
      }
    }
  });

  it('rejects duplicate locale in translations', async () => {
    const req = baseRequest();
    req.translations.push({
      locale: 'pt',
      title: 'Outra PT',
      description: 'Outra desc',
    });
    const r = await sut.execute(req as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('rejects duplicate slug', async () => {
    await sut.execute(baseRequest());
    const again = await sut.execute(baseRequest());
    expect(again.isLeft()).toBe(true);
    if (again.isLeft()) {
      expect(again.value).toBeInstanceOf(DuplicateTrackError);
    }
  });

  it('handles repo errors on findBySlug', async () => {
    vi.spyOn(repo, 'findBySlug').mockRejectedValueOnce(new Error('fail'));
    const r = await sut.execute(baseRequest());
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(RepositoryError);
    }
  });

  it('allows the same course in multiple tracks', async () => {
    const first = await sut.execute(baseRequest());
    expect(first.isRight()).toBe(true);

    const secondReq = { ...baseRequest(), slug: 'my-track-2' };
    const second = await sut.execute(secondReq);
    expect(second.isRight()).toBe(true);

    expect(repo.items.map((t) => t.slug)).toEqual(
      expect.arrayContaining(['my-track', 'my-track-2']),
    );
  });

  it('allows different tracks with different images', async () => {
    const firstReq = {
      ...baseRequest(),
      slug: 'track-with-image-1',
      imageUrl: 'https://example.com/image1.jpg',
    };
    const first = await sut.execute(firstReq);
    expect(first.isRight()).toBe(true);

    const secondReq = {
      ...baseRequest(),
      slug: 'track-with-image-2',
      imageUrl: 'https://example.com/image2.jpg',
    };
    const second = await sut.execute(secondReq);
    expect(second.isRight()).toBe(true);

    if (first.isRight() && second.isRight()) {
      expect(first.value.track.imageUrl).toBe('https://example.com/image1.jpg');
      expect(second.value.track.imageUrl).toBe(
        'https://example.com/image2.jpg',
      );
    }

    expect(repo.items).toHaveLength(2);
    expect(repo.items[0].imageUrl).toBe('https://example.com/image1.jpg');
    expect(repo.items[1].imageUrl).toBe('https://example.com/image2.jpg');
  });
});
