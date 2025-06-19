import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { ListLessonsUseCase } from '@/domain/course-catalog/application/use-cases/list-lessons.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { left, right } from '@/core/either';
import { TranslationDto } from '@/domain/course-catalog/application/dtos/translation.dto';

describe('LessonController', () => {
  let controller: LessonController;
  let createLesson: { execute: ReturnType<typeof vi.fn> };
  let listLessons: { execute: ReturnType<typeof vi.fn> };

  const moduleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const videoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const validTranslations: TranslationDto[] = [
    { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
    { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
    { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
  ];

  beforeEach(() => {
    createLesson = { execute: vi.fn() };
    listLessons = { execute: vi.fn() };
    controller = new LessonController(createLesson as any, listLessons as any);
  });

  describe('Create Lesson (POST)', () => {
    it('creates lesson without video successfully', async () => {
      const dto = { translations: validTranslations };
      const expected = {
        lesson: { id: 'lesson-1', moduleId, translations: validTranslations },
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

    it('throws 400 on invalid input', async () => {
      const dto = { translations: [] };
      const details = [
        { path: ['translations'], message: 'Invalid', code: 'too_small' },
      ];
      createLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 404 when module not found', async () => {
      const dto = { translations: validTranslations };
      createLesson.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError('Module not found')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 404,
        response: 'Module not found',
      });
    });

    it('throws 400 when video not found', async () => {
      const dto = { translations: validTranslations, videoId };
      createLesson.execute.mockResolvedValueOnce(
        left(new VideoNotFoundError()),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: 'Video not found',
      });
    });

    it('throws 500 on repository error', async () => {
      const dto = { translations: validTranslations };
      createLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('DB failed')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'DB failed',
      });
    });
  });

  describe('List Lessons (GET)', () => {
    const lessonsResponse = {
      lessons: [{ id: 'l1' }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    it('returns lessons successfully with defaults', async () => {
      listLessons.execute.mockResolvedValueOnce(right(lessonsResponse));

      const result = await controller.list(
        moduleId,
        undefined,
        undefined,
        undefined,
      );

      expect(listLessons.execute).toHaveBeenCalledWith({
        moduleId,
        page: 1,
        limit: 10,
        includeVideo: false,
      });
      expect(result).toEqual(lessonsResponse);
    });

    it('parses query params correctly', async () => {
      listLessons.execute.mockResolvedValueOnce(right(lessonsResponse));

      const result = await controller.list(
        moduleId,
        '2' as any,
        '5' as any,
        'true' as any,
      );

      expect(listLessons.execute).toHaveBeenCalledWith({
        moduleId,
        page: 2,
        limit: 5,
        includeVideo: true,
      });
      expect(result).toEqual(lessonsResponse);
    });

    it('throws 400 on invalid input', async () => {
      const details = [
        { path: ['page'], message: 'Invalid', code: 'invalid_type' },
      ];
      listLessons.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.list(moduleId, '0' as any, '10' as any, 'false' as any),
      ).rejects.toMatchObject({ status: 400, response: details });
    });

    it('throws 404 when module not found', async () => {
      listLessons.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError('Module missing')),
      );

      await expect(
        controller.list(moduleId, '1' as any, '10' as any, 'false' as any),
      ).rejects.toMatchObject({ status: 404, response: 'Module missing' });
    });

    it('throws 500 on repository error', async () => {
      listLessons.execute.mockResolvedValueOnce(
        left(new RepositoryError('DB error')),
      );

      await expect(
        controller.list(moduleId, '1' as any, '10' as any, 'false' as any),
      ).rejects.toMatchObject({ status: 500, response: 'DB error' });
    });
  });
});
