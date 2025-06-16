import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetVideosUseCase } from '@/domain/course-catalog/application/use-cases/get-videos.use-case';
import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

let repo: InMemoryVideoRepository;
let sut: GetVideosUseCase;

// Valid UUIDs for tests
const VALID_COURSE_ID = '11111111-1111-1111-1111-111111111111';
const VALID_MODULE_ID = '22222222-2222-2222-2222-222222222222';

function baseVideo(id: string): Video {
  const now = new Date();
  return Video.reconstruct(
    { slug: 'v1', title: 'T', providerVideoId: 'pid', durationInSeconds: 10, isSeen: false, createdAt: now, updatedAt: now },
    new UniqueEntityID(id)
  );
}

describe('GetVideosUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryVideoRepository();
    sut = new GetVideosUseCase(repo);
  });

  it('returns empty array when no videos', async () => {
    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.videos).toHaveLength(0);
    }
  });

  it('returns list of videos when present', async () => {
    const video = baseVideo('33333333-3333-3333-3333-333333333333');
    const translations: Array<{ locale: 'pt'|'it'|'es'; title: string; description: string }> = [
      { locale: 'pt', title: 'T1', description: 'D1' }
    ];
    await repo.create(VALID_MODULE_ID, video, translations);

    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.videos).toEqual([
        {
          id: '33333333-3333-3333-3333-333333333333',
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          translations,
        }
      ]);
    }
  });

  it('returns all translations for each video', async () => {
    const video = baseVideo('44444444-4444-4444-4444-444444444444');
    const translations: Array<{ locale: 'pt'|'it'|'es'; title: string; description: string }> = [
      { locale: 'pt', title: 'PT', description: 'D1' },
      { locale: 'it', title: 'IT', description: 'D2' },
      { locale: 'es', title: 'ES', description: 'D3' },
    ];
    await repo.create(VALID_MODULE_ID, video, translations);

    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.videos[0].translations).toEqual(translations);
    }
  });

  it('returns InvalidInputError when courseId is missing', async () => {
    // @ts-expect-error: missing courseId
    const result = await sut.execute({ moduleId: VALID_MODULE_ID });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    } else {
      fail('Expected InvalidInputError');
    }
  });

  it('returns InvalidInputError when moduleId is missing', async () => {
    // @ts-expect-error: missing moduleId
    const result = await sut.execute({ courseId: VALID_COURSE_ID });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    } else {
      fail('Expected InvalidInputError');
    }
  });

  it('returns InvalidInputError when request has extra property', async () => {
    // @ts-expect-error: extra prop
    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID, foo: 'bar' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    } else {
      fail('Expected InvalidInputError');
    }
  });

  it('supports multiple videos in the same module', async () => {
    const v1 = baseVideo('id1');
    const v2 = baseVideo('id2');
    const tr: Array<{ locale: 'pt'|'it'|'es'; title: string; description: string }> = [
      { locale: 'pt', title: 'T', description: 'D' }
    ];
    await repo.create(VALID_MODULE_ID, v1, tr);
    await repo.create(VALID_MODULE_ID, v2, tr);

    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.videos).toHaveLength(2);
      expect(result.value.videos.map(v => v.id)).toEqual(['id1', 'id2']);
    }
  });

  it('propagates RepositoryError when repo fails', async () => {
    vi.spyOn(repo, 'findByLesson').mockRejectedValueOnce(new Error('DB failure'));
    const result = await sut.execute({ courseId: VALID_COURSE_ID, moduleId: VALID_MODULE_ID });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
    } else {
      fail('Expected RepositoryError');
    }
  });
});