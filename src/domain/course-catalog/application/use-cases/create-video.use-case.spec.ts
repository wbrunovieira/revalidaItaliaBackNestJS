// src/domain/course-catalog/application/use-cases/create-video.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateVideoUseCase } from './create-video.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DuplicateVideoError } from './errors/duplicate-video-error';
import { RepositoryError } from './errors/repository-error';
import { right, left } from '@/core/either';
import { VideoHostProvider } from '../providers/video-host.provider';

function aValidRequest() {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    slug: 'video-test',
    providerVideoId: 'panda-123',
    translations: [
      { locale: 'pt', title: 'Vídeo Teste', description: 'Desc PT' },
      { locale: 'it', title: 'Video Test',    description: 'Desc IT' },
      { locale: 'es', title: 'Vídeo Prueba',  description: 'Desc ES' },
    ],
  };
}

describe('CreateVideoUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let videoRepo: InMemoryVideoRepository;
  let host: VideoHostProvider;
  let getMetadataSpy: ReturnType<typeof vi.fn>;
  let sut: CreateVideoUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    videoRepo = new InMemoryVideoRepository();

    getMetadataSpy = vi.fn(async () => ({ durationInSeconds: 123 }));
    const getEmbedUrlSpy = vi.fn(() => 'embed-url');
    host = { getMetadata: getMetadataSpy, getEmbedUrl: getEmbedUrlSpy };

    sut = new CreateVideoUseCase(
      lessonRepo as any,
      videoRepo as any,
      host
    );
  });

  it('creates a video successfully', async () => {
    // preparar uma lição existente em memória
    const lesson = Lesson.create(
      { 
        moduleId: 'mod-1', 
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }], 
        flashcardIds: [], quizIds: [], commentIds: [] 
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
    await lessonRepo.create(lesson);

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.video.slug).toBe('video-test');
      expect(result.value.video.durationInSeconds).toBe(123);
      expect(getMetadataSpy).toHaveBeenCalledWith('panda-123');
    }
  });

  it('returns InvalidInputError for missing providerVideoId', async () => {
    const req = { ...aValidRequest(), providerVideoId: '' };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['providerVideoId'] })
      ]));
  });

  it('returns InvalidInputError for missing Portuguese translation', async () => {
    const req = aValidRequest();
    req.translations = req.translations.filter(t => t.locale !== 'pt');
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect((result.value as InvalidInputError).details[0].message)
      .toMatch(/exactly three translations required/i);
  });

  it('errors if lesson not found', async () => {
    // não criamos nada em lessonRepo
    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('errors on invalid slug format', async () => {
    // criar a lição primeiro
    const lesson = Lesson.create(
      { 
        moduleId: 'mod-1', 
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }], 
        flashcardIds: [], quizIds: [], commentIds: [] 
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
    await lessonRepo.create(lesson);

    const req = { ...aValidRequest(), slug: 'Bad Slug!' };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('errors on duplicate slug', async () => {
    // criar a lição
    const lesson = Lesson.create(
      { 
        moduleId: 'mod-1', 
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }], 
        flashcardIds: [], quizIds: [], commentIds: [] 
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
    await lessonRepo.create(lesson);
    // forçar slug duplicado
    vi.spyOn(videoRepo, 'findBySlug').mockResolvedValueOnce(
      right(lesson as any)
    );

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DuplicateVideoError);
  });

  it('propagates host errors as RepositoryError', async () => {
    const lesson = Lesson.create(
      { 
        moduleId: 'mod-1', 
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }], 
        flashcardIds: [], quizIds: [], commentIds: [] 
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
    await lessonRepo.create(lesson);
    getMetadataSpy.mockRejectedValueOnce(new Error('host fail'));

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  it('propagates repo.create errors as RepositoryError', async () => {
    const lesson = Lesson.create(
      { 
        moduleId: 'mod-1', 
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }], 
        flashcardIds: [], quizIds: [], commentIds: [] 
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
    await lessonRepo.create(lesson);
    vi.spyOn(videoRepo, 'create').mockResolvedValueOnce(
      left(new Error('save fail'))
    );

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });
});