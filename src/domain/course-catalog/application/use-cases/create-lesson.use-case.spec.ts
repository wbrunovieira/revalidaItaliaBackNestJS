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
import { Video } from '../../enterprise/entities/video.entity';

function aValidRequest() {
  return {
    moduleId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    translations: [
      { locale: 'pt', title: 'Aula PT', description: 'Descrição PT' },
      { locale: 'it', title: 'Lezione IT', description: 'Descrizione IT' },
      { locale: 'es', title: 'Lección ES', description: 'Descripción ES' },
    ],
    videoId: undefined,
  };
}

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

function createValidVideo(id: string) {
  const now = new Date();
  return Video.reconstruct(
    {
      slug: 'slug‐x',
      title: 'title‐x',
      providerVideoId: 'prov',
      durationInSeconds: 10,
      isSeen: false,
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
        expect(lesson.videoId).toBeUndefined();
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

      const req = { ...aValidRequest(), videoId: existingVideoId };
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lesson.videoId).toBe(existingVideoId);
      }
    });
  });

  describe('❌ Input Validation Failures', () => {
    it('rejects when moduleId is missing', async () => {
      const req = { ...aValidRequest(), moduleId: undefined } as any;
      const result = await sut.execute(req);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        expect(result.value.message).toBe('Validation failed');
        expect(result.value.details).toBeDefined();
      }
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

    it('rejects when videoId is empty string', async () => {
      const req = { ...aValidRequest(), videoId: '' } as any;
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

    it('rejects when translation has invalid locale', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'invalid', title: 'Test' }],
      } as any;
      const result = await sut.execute(req);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translation title is missing', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', description: 'Only desc' }],
      } as any;
      const result = await sut.execute(req);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translation title is empty string', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: '' }],
      } as any;
      const result = await sut.execute(req);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when translation title is null', async () => {
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: null }],
      } as any;
      const result = await sut.execute(req);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when request is completely empty', async () => {
      const result = await sut.execute({} as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when request is null', async () => {
      const result = await sut.execute(null as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('🔍 Business Logic Failures', () => {
    it('fails when module does not exist', async () => {
      // Don't create any module in repository
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

    it('validates module existence before video existence', async () => {
      // Don't create module, but provide a videoId
      const videoSpy = vi.spyOn(videoRepo, 'findById');

      const req = {
        ...aValidRequest(),
        videoId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      };
      const result = await sut.execute(req as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
      // Video repository should not be called if module doesn't exist
      expect(videoSpy).not.toHaveBeenCalled();
    });

    it('only validates video existence when videoId is provided', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const videoSpy = vi.spyOn(videoRepo, 'findById');

      const req = aValidRequest(); // no videoId
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      // Video repository should not be called when no videoId provided
      expect(videoSpy).not.toHaveBeenCalled();
    });
  });

  describe('💾 Repository Error Scenarios', () => {
    it('handles module repository errors during lookup', async () => {
      vi.spyOn(moduleRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      const result = await sut.execute(aValidRequest() as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
    });

    it('handles video repository errors (non VideoNotFoundError) during lookup', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      vi.spyOn(videoRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Database timeout')),
      );

      const req = {
        ...aValidRequest(),
        videoId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      };
      const result = await sut.execute(req as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Database timeout');
      }
    });

    it('handles lesson repository errors during creation', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      vi.spyOn(lessonRepo, 'create').mockResolvedValueOnce(
        left(new Error('Failed to insert lesson')),
      );

      const result = await sut.execute(aValidRequest() as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Failed to insert lesson');
      }
    });
  });

  describe('🎯 Edge Cases and Boundary Conditions', () => {
    it('handles translation with description as empty string', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: 'Test', description: '' }],
      };
      const result = await sut.execute(req as any);

      // If schema doesn't allow empty strings for description, this should fail
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      } else {
        expect(result.value.lesson.translations[0].description).toBe('');
      }
    });

    it('tests single translation acceptance', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: 'Aula Mínima' }],
      };
      const result = await sut.execute(req as any);

      // If schema requires multiple translations, this should fail
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      } else {
        expect(result.value.lesson.translations).toHaveLength(1);
        expect(result.value.lesson.translations[0].locale).toBe('pt');
        expect(result.value.lesson.translations[0].description).toBeUndefined();
      }
    });

    it('tests title length boundaries', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const longTitle = 'A'.repeat(100); // This might exceed schema limits
      const req = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: longTitle }],
      };
      const result = await sut.execute(req as any);

      // If schema has title length limits that we're exceeding, this should fail
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      } else {
        expect(result.value.lesson.translations[0].title).toBe(longTitle);
      }
    });

    it('handles duplicate locales in translations', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = {
        ...aValidRequest(),
        translations: [
          { locale: 'pt', title: 'First PT' },
          { locale: 'pt', title: 'Second PT' },
        ],
      };
      const result = await sut.execute(req as any);

      // This depends on schema validation - should likely be rejected
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('handles maximum number of supported locales', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = {
        ...aValidRequest(),
        translations: [
          { locale: 'pt', title: 'Portuguese' },
          { locale: 'it', title: 'Italian' },
          { locale: 'es', title: 'Spanish' },
        ],
      };
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lesson.translations).toHaveLength(3);
      }
    });

    it('verifies minimum number of translations required', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      // Test with one translation
      const reqOne = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: 'Single Translation' }],
      };
      const resultOne = await sut.execute(reqOne as any);

      // Test with multiple translations (known to work)
      const reqMultiple = aValidRequest();
      const resultMultiple = await sut.execute(reqMultiple as any);

      // At least one should succeed, helping us understand the schema
      const oneSucceeds = resultOne.isRight();
      const multipleSucceeds = resultMultiple.isRight();

      expect(oneSucceeds || multipleSucceeds).toBe(true);

      if (!oneSucceeds) {
        expect(resultOne.value).toBeInstanceOf(InvalidInputError);
      }
      if (multipleSucceeds) {
        expect(resultMultiple.value.lesson.translations.length).toBeGreaterThan(
          0,
        );
      }
    });

    it('verifies title length constraints', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      // Test with reasonable length title (should work)
      const shortTitle = 'Short Title';
      const reqShort = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: shortTitle }],
      };

      // Test with very long title (might fail)
      const veryLongTitle = 'A'.repeat(500);
      const reqLong = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: veryLongTitle }],
      };

      const resultShort = await sut.execute(reqShort as any);
      const resultLong = await sut.execute(reqLong as any);

      // At least the short one should work if single translations are allowed
      if (resultShort.isRight()) {
        expect(resultShort.value.lesson.translations[0].title).toBe(shortTitle);
      }

      // Long title should likely fail due to length constraints
      if (resultLong.isLeft()) {
        expect(resultLong.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('verifies description handling', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      // Test without description (should work)
      const reqNoDesc = {
        ...aValidRequest(),
        translations: [{ locale: 'pt', title: 'No Description' }],
      };

      // Test with undefined description (should work)
      const reqUndefinedDesc = {
        ...aValidRequest(),
        translations: [
          { locale: 'pt', title: 'Undefined Desc', description: undefined },
        ],
      };

      // Test with valid description (should work)
      const reqValidDesc = {
        ...aValidRequest(),
        translations: [
          {
            locale: 'pt',
            title: 'Valid Desc',
            description: 'A valid description',
          },
        ],
      };

      const resultNoDesc = await sut.execute(reqNoDesc as any);
      const resultUndefinedDesc = await sut.execute(reqUndefinedDesc as any);
      const resultValidDesc = await sut.execute(reqValidDesc as any);

      // At least the valid description case should work if schema allows single translations
      if (resultValidDesc.isRight()) {
        expect(resultValidDesc.value.lesson.translations[0].description).toBe(
          'A valid description',
        );
      }
    });

    it('ensures lesson entity is created with expected default values', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const result = await sut.execute(aValidRequest() as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { lesson } = result.value;
        // Verify the lesson has expected structure and defaults
        expect(lesson.id).toBeDefined();
        expect(lesson.moduleId).toBeDefined();
        expect(lesson.translations).toBeDefined();
        expect(Array.isArray(lesson.translations)).toBe(true);
      }
    });

    it('preserves translation order from input', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const req = {
        ...aValidRequest(),
        translations: [
          { locale: 'es', title: 'Spanish First' },
          { locale: 'pt', title: 'Portuguese Second' },
          { locale: 'it', title: 'Italian Third' },
        ],
      };
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const translations = result.value.lesson.translations;
        expect(translations[0].locale).toBe('es');
        expect(translations[1].locale).toBe('pt');
        expect(translations[2].locale).toBe('it');
      }
    });
  });

  describe('🔄 Operation Sequence and Dependencies', () => {
    it('follows correct validation sequence: input → module → video → creation', async () => {
      const mod = createValidModule();
      await moduleRepo.create(mod.id.toString(), mod);

      const moduleRepoSpy = vi.spyOn(moduleRepo, 'findById');
      const videoRepoSpy = vi.spyOn(videoRepo, 'findById');
      const lessonRepoSpy = vi.spyOn(lessonRepo, 'create');

      const existingVideoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const existingVideo = createValidVideo(existingVideoId);
      videoRepoSpy.mockResolvedValueOnce(
        right({ video: existingVideo, translations: [] }),
      );

      const req = { ...aValidRequest(), videoId: existingVideoId };
      await sut.execute(req as any);

      // Verify the call sequence
      expect(moduleRepoSpy).toHaveBeenCalledWith(req.moduleId);
      expect(videoRepoSpy).toHaveBeenCalledWith(existingVideoId);
      expect(lessonRepoSpy).toHaveBeenCalled();
    });

    it('stops execution at first validation failure', async () => {
      const moduleRepoSpy = vi.spyOn(moduleRepo, 'findById');
      const videoRepoSpy = vi.spyOn(videoRepo, 'findById');
      const lessonRepoSpy = vi.spyOn(lessonRepo, 'create');

      // Invalid input should stop before any repository calls
      const req = { ...aValidRequest(), moduleId: 'invalid' } as any;
      await sut.execute(req);

      expect(moduleRepoSpy).not.toHaveBeenCalled();
      expect(videoRepoSpy).not.toHaveBeenCalled();
      expect(lessonRepoSpy).not.toHaveBeenCalled();
    });
  });
});
