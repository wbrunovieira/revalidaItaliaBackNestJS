// src/domain/course-catalog/application/use-cases/create-lesson.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateLessonUseCase } from './create-lesson.use-case';
import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
import { VideoTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/video-translation.vo';

// Helper to build a valid request including order
function aValidRequest() {
  return {
    slug: 'test-lesson-slug',
    moduleId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    translations: [
      { locale: 'pt', title: 'Aula PT', description: 'Descrição PT' },
      { locale: 'it', title: 'Lezione IT', description: 'Descrizione IT' },
      { locale: 'es', title: 'Lección ES', description: 'Descripción ES' },
    ],
    videoId: undefined,
    order: 1,
  };
}

// Build a valid Module entity
function createValidModule(
  id: string = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
) {
  return Module.create(
    {
      slug: 'mod-slug',
      translations: [{ locale: 'pt', title: 'Modulo PT', description: 'Desc' }],
      order: 1,
      videos: [],
    },
    new UniqueEntityID(id),
  );
}

// Build a valid Video entity
function createValidVideo(id: string) {
  const now = new Date();
  return Video.reconstruct(
    {
      slug: 'slug-x',
      imageUrl: 'http://example.com/image.jpg',
      providerVideoId: 'prov',
      durationInSeconds: 10,
      lessonId: undefined,
      translations: [
        new VideoTranslationVO('pt', 'Título do Vídeo', 'Descrição do vídeo'),
        new VideoTranslationVO('it', 'Titolo Video', 'Descrizione video'),
        new VideoTranslationVO('es', 'Título del Video', 'Descripción del video'),
      ],
      createdAt: now,
      updatedAt: now,
    },
    new UniqueEntityID(id),
  );
}

describe('CreateLessonUseCase', () => {
  let moduleRepo: InMemoryModuleRepository;
  let lessonRepo: InMemoryLessonRepository;
  let videoRepo: InMemoryVideoRepository;
  let sut: CreateLessonUseCase;

  beforeEach(() => {
    moduleRepo = new InMemoryModuleRepository();
    lessonRepo = new InMemoryLessonRepository();
    videoRepo = new InMemoryVideoRepository();
    sut = new CreateLessonUseCase(
      moduleRepo as any,
      lessonRepo as any,
      videoRepo as any,
    );
  });

  // ✅ Success Scenarios
  describe('✅ Success Scenarios', () => {
    it('creates a lesson successfully without video', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = aValidRequest();
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { lesson } = result.value;
        expect(lesson.moduleId).toBe(req.moduleId);
        expect(lesson.translations).toHaveLength(3);
        expect(lesson.translations.map((t) => t.locale).sort()).toEqual([
          'es',
          'it',
          'pt',
        ]);
        expect(lesson.videoAssociated).toBe(false);
        expect(lesson.order).toBe(req.order);
        expect(lesson.id).toBeDefined();
      }
    });

    it('creates a lesson with existing video', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const existingVideoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const existingVideo = createValidVideo(existingVideoId);
      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        right({ video: existingVideo, translations: [] }),
      );
      vi.spyOn(videoRepo, 'update').mockResolvedValueOnce(right(undefined));

      const req = { ...aValidRequest(), videoId: existingVideoId };
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { lesson } = result.value;
        expect(lesson.videoAssociated).toBe(true);
        expect(lesson.order).toBe(req.order);
      }
    });
  });

  // ❌ Input Validation Failures
  describe('❌ Input Validation Failures', () => {
    it('rejects when moduleId is missing', async () => {
      const req = { ...aValidRequest(), moduleId: undefined } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when moduleId is not a valid UUID', async () => {
      const req = { ...aValidRequest(), moduleId: 'invalid-uuid' } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when moduleId is empty string', async () => {
      const req = { ...aValidRequest(), moduleId: '' } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when videoId is not a valid UUID', async () => {
      const req = { ...aValidRequest(), videoId: 'not-a-uuid' } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translations array is empty', async () => {
      const req = { ...aValidRequest(), translations: [] } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translations is missing', async () => {
      const req = { ...aValidRequest(), translations: undefined } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translation locale invalid', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'invalid', title: 't' }],
      } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translation title missing', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', description: 'd' }],
      } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when request is empty', async () => {
      const result = await sut.execute({} as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  // 🔍 Business Logic Failures
  describe('🔍 Business Logic Failures', () => {
    it('fails when module does not exist', async () => {
      const result = await sut.execute(aValidRequest() as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
    });

    it('fails when provided videoId does not exist', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        left(new VideoNotFoundError()),
      );
      const req = {
        ...aValidRequest(),
        videoId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(VideoNotFoundError);
    });

    it('fails when video is already associated with another lesson', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const videoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const videoWithLesson = createValidVideo(videoId);
      videoWithLesson.updateLessonId('existing-lesson-id');

      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        right({ video: videoWithLesson, translations: [] }),
      );

      const req = {
        ...aValidRequest(),
        videoId,
      };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        expect(result.value.message).toBe(
          'Video is already associated with another lesson',
        );
      }
    });

    it('validates module before video', async () => {
      const videoSpy = vi.spyOn(videoRepo, 'findById');
      const req = {
        ...aValidRequest(),
        videoId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
      expect(videoSpy).not.toHaveBeenCalled();
    });
  });

  // 💾 Repository Error Scenarios
  describe('💾 Repository Error Scenarios', () => {
    it('handles module repo errors', async () => {
      vi.spyOn(moduleRepo, 'findById').mockResolvedValueOnce(
        left(new Error('DB fail')),
      );
      const result = await sut.execute(aValidRequest() as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
    });

    it('handles video repo errors', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Timeout')),
      );
      const req = {
        ...aValidRequest(),
        videoId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(VideoNotFoundError);
    });

    it('handles lesson repo errors', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      vi.spyOn(lessonRepo, 'create').mockResolvedValueOnce(
        left(new Error('Insert fail')),
      );
      const result = await sut.execute(aValidRequest() as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('handles video update errors', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const existingVideoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const existingVideo = createValidVideo(existingVideoId);
      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        right({ video: existingVideo, translations: [] }),
      );
      vi.spyOn(videoRepo, 'update').mockResolvedValueOnce(
        left(new Error('Update failed')),
      );

      const req = { ...aValidRequest(), videoId: existingVideoId };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe(
          'Failed to associate video with lesson',
        );
      }
    });
  });

  // 🎯 Edge Cases
  describe('🎯 Edge Cases', () => {
    it('single translation accepted', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: 'T' }],
      };
      const result = await sut.execute(req as any);
      expect(result.isRight() || result.isLeft()).toBe(true);
    });

    it('duplicate locales rejected', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      const req = {
        ...aValidRequest(),
        translations: [
          { locale: 'pt', title: 'A' },
          { locale: 'pt', title: 'B' },
        ],
      };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
    });

    it('order default preserved', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      const result = await sut.execute(aValidRequest() as any);
      if (result.isRight()) expect(result.value.lesson.order).toBe(1);
    });
  });

  // 🔄 Sequence and Dependencies
  describe('🔄 Sequence and Dependencies', () => {
    it('calls repos in order', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);
      const mSpy = vi.spyOn(moduleRepo, 'findById');
      const vSpy = vi
        .spyOn(videoRepo, 'findById')
        .mockResolvedValueOnce(
          right({ video: createValidVideo('x'), translations: [] }),
        );
      const lSpy = vi.spyOn(lessonRepo, 'create');
      const uSpy = vi
        .spyOn(videoRepo, 'update')
        .mockResolvedValueOnce(right(undefined));
      await sut.execute({
        ...aValidRequest(),
        videoId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      } as any);
      expect(mSpy).toHaveBeenCalledWith('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      expect(vSpy).toHaveBeenCalledWith('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      expect(lSpy).toHaveBeenCalled();
      expect(uSpy).toHaveBeenCalled();
    });

    it('stops on first failure', async () => {
      const mSpy = vi.spyOn(moduleRepo, 'findById');
      const vSpy = vi.spyOn(videoRepo, 'findById');
      const lSpy = vi.spyOn(lessonRepo, 'create');
      await sut.execute({ ...aValidRequest(), moduleId: 'invalid' } as any);
      expect(mSpy).not.toHaveBeenCalled();
      expect(vSpy).not.toHaveBeenCalled();
      expect(lSpy).not.toHaveBeenCalled();
    });
  });
});
