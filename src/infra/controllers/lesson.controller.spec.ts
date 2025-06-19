// src/infra/course-catalog/controllers/lesson.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { left, right } from '@/core/either';
import { TranslationDto } from '@/domain/course-catalog/application/dtos/translation.dto';

describe('LessonController', () => {
  let controller: LessonController;
  let createLesson: { execute: ReturnType<typeof vi.fn> };

  const moduleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const videoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const validTranslations: TranslationDto[] = [
    { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
    { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
    { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
  ];

  beforeEach(() => {
    createLesson = { execute: vi.fn() };
    controller = new LessonController(createLesson as any);
  });

  describe('✅ Success Scenarios', () => {
    it('creates lesson without video successfully', async () => {
      const dto = { translations: validTranslations };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        translations: validTranslations,
        videoId: undefined,
      });
      expect(result).toEqual(expected.lesson);
    });

    it('creates lesson with video successfully', async () => {
      const dto = { translations: validTranslations, videoId };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          videoId,
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        translations: validTranslations,
        videoId,
      });
      expect(result).toEqual(expected.lesson);
      expect(result.videoId).toBe(videoId);
    });

    it('creates lesson with minimal valid translations', async () => {
      const minimalTranslations: TranslationDto[] = [
        { locale: 'pt', title: 'Minimal' },
      ];
      const dto = { translations: minimalTranslations };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          translations: minimalTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(result.translations).toEqual(minimalTranslations);
    });
  });

  describe('❌ Bad Request Errors (400)', () => {
    it('throws BadRequestException on invalid input validation', async () => {
      const invalidDto = { translations: [] }; // Empty translations
      const details = [
        {
          path: ['translations'],
          message: 'Array must contain at least 1 element(s)',
          code: 'too_small',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.create(moduleId, invalidDto),
      ).rejects.toMatchObject({
        status: 400,
        response: details,
      });

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        translations: [],
        videoId: undefined,
      });
    });

    it('throws BadRequestException on invalid moduleId format', async () => {
      const dto = { translations: validTranslations };
      const details = [
        {
          path: ['moduleId'],
          message: 'Invalid uuid',
          code: 'invalid_string',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.create('invalid-uuid', dto),
      ).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws BadRequestException on invalid videoId', async () => {
      const dto = {
        translations: validTranslations,
        videoId: 'invalid-video-id',
      };
      const details = [
        {
          path: ['videoId'],
          message: 'Invalid uuid',
          code: 'invalid_string',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws BadRequestException when video not found', async () => {
      const dto = { translations: validTranslations, videoId };
      createLesson.execute.mockResolvedValueOnce(
        left(new VideoNotFoundError()),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: 'Video not found',
      });
    });

    it('throws BadRequestException on invalid translation locale', async () => {
      const invalidTranslations = [{ locale: 'invalid', title: 'Test' }] as any;
      const dto = { translations: invalidTranslations };
      const details = [
        {
          path: ['translations', 0, 'locale'],
          message:
            "Invalid enum value. Expected 'pt' | 'it' | 'es', received 'invalid'",
          code: 'invalid_enum_value',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws BadRequestException on missing translation title', async () => {
      const invalidTranslations = [
        { locale: 'pt', description: 'Only desc' },
      ] as any;
      const dto = { translations: invalidTranslations };
      const details = [
        {
          path: ['translations', 0, 'title'],
          message: 'Required',
          code: 'invalid_type',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });
  });

  describe('🔍 Not Found Errors (404)', () => {
    it('throws NotFoundException when module not found', async () => {
      const dto = { translations: validTranslations };
      createLesson.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError('Module not found')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 404,
        response: 'Module not found',
      });
    });

    it('throws NotFoundException with custom message', async () => {
      const dto = { translations: validTranslations };
      const customMessage = `Module ${moduleId} does not exist`;
      createLesson.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError(customMessage)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 404,
        response: customMessage,
      });
    });
  });

  describe('💥 Internal Server Errors (500)', () => {
    it('throws InternalServerErrorException on repository error', async () => {
      const dto = { translations: validTranslations };
      createLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'Database connection failed',
      });
    });

    it('throws InternalServerErrorException on unknown error', async () => {
      const dto = { translations: validTranslations };
      // Simulate an unknown error type
      class UnknownError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'UnknownError';
        }
      }
      createLesson.execute.mockResolvedValueOnce(
        left(new UnknownError('Something unexpected happened')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'Unknown error occurred',
      });
    });

    it('handles repository timeout errors', async () => {
      const dto = { translations: validTranslations };
      createLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('Query timeout')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'Query timeout',
      });
    });
  });

  describe('🎯 Edge Cases and Parameter Handling', () => {
    it('handles empty translations array', async () => {
      const dto = { translations: [] };
      const details = [
        {
          path: ['translations'],
          message: 'Array must contain at least 1 element(s)',
          code: 'too_small',
        },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('correctly passes undefined videoId when not provided', async () => {
      const dto = { translations: validTranslations };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        translations: validTranslations,
        videoId: undefined,
      });
    });

    it('correctly passes videoId when provided', async () => {
      const dto = { translations: validTranslations, videoId };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          videoId,
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        translations: validTranslations,
        videoId,
      });
    });

    it('preserves translation order in response', async () => {
      const orderedTranslations: TranslationDto[] = [
        { locale: 'es', title: 'Spanish First' },
        { locale: 'pt', title: 'Portuguese Second' },
        { locale: 'it', title: 'Italian Third' },
      ];
      const dto = { translations: orderedTranslations };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          translations: orderedTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(result.translations[0].locale).toBe('es');
      expect(result.translations[1].locale).toBe('pt');
      expect(result.translations[2].locale).toBe('it');
    });
  });

  describe('🔄 Use Case Integration', () => {
    it('passes all parameters correctly to use case', async () => {
      const dto = {
        translations: validTranslations,
        videoId: 'test-video-id',
      };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId: 'test-module-id',
          videoId: 'test-video-id',
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      await controller.create('test-module-id', dto);

      expect(createLesson.execute).toHaveBeenCalledTimes(1);
      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId: 'test-module-id',
        translations: validTranslations,
        videoId: 'test-video-id',
      });
    });

    it('only calls use case once per request', async () => {
      const dto = { translations: validTranslations };
      const expected = {
        lesson: {
          id: 'lesson-1',
          moduleId,
          translations: validTranslations,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledTimes(1);
    });
  });
});
