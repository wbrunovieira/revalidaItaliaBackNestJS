// src/infra/course-catalog/controllers/lesson.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { ListLessonsUseCase } from '@/domain/course-catalog/application/use-cases/list-lessons.use-case';
import { GetLessonUseCase } from '@/domain/course-catalog/application/use-cases/get-lesson.use-case';
import { DeleteLessonUseCase } from '@/domain/course-catalog/application/use-cases/delete-lesson.use-case';
import { UpdateLessonUseCase } from '@/domain/course-catalog/application/use-cases/update-lesson.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { LessonHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/lesson-has-dependencies-error';
import { DuplicateLessonOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-lesson-order-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { left, right } from '@/core/either';
import { TranslationDto } from '@/domain/course-catalog/application/dtos/translation.dto';

describe('LessonController', () => {
  let controller: LessonController;
  let createLesson: { execute: ReturnType<typeof vi.fn> };
  let listLessons: { execute: ReturnType<typeof vi.fn> };
  let getLesson: { execute: ReturnType<typeof vi.fn> };
  let deleteLesson: { execute: ReturnType<typeof vi.fn> };
  let updateLesson: { execute: ReturnType<typeof vi.fn> };

  const moduleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const lessonId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const videoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const validTranslations: TranslationDto[] = [
    { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
    { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
    { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
  ];

  beforeEach(() => {
    createLesson = { execute: vi.fn() };
    listLessons = { execute: vi.fn() };
    getLesson = { execute: vi.fn() };
    deleteLesson = { execute: vi.fn() };
    updateLesson = { execute: vi.fn() };
    controller = new LessonController(
      createLesson as any,
      listLessons as any,
      getLesson as any,
      deleteLesson as any,
      updateLesson as any,
    );
  });

  describe('Create Lesson (POST)', () => {
    it('creates lesson without video successfully', async () => {
      const dto = {
        slug: 'lesson-slug',
        order: 1,
        translations: validTranslations,
      };
      const expected = {
        lesson: { id: 'lesson-1', moduleId, translations: validTranslations },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        slug: 'lesson-slug',
        order: 1,
        imageUrl: undefined,
        translations: validTranslations,
        videoId: undefined,
        flashcardIds: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(expected.lesson);
    });

    it('creates lesson with video successfully', async () => {
      const dto = {
        slug: 'lesson-with-video',
        order: 2,
        translations: validTranslations,
        videoId,
      };
      const expected = {
        lesson: {
          id: 'lesson-2',
          moduleId,
          translations: validTranslations,
          videoId,
        },
      };
      createLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.create(moduleId, dto);

      expect(createLesson.execute).toHaveBeenCalledWith({
        moduleId,
        slug: 'lesson-with-video',
        order: 2,
        imageUrl: undefined,
        translations: validTranslations,
        videoId,
        flashcardIds: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(expected.lesson);
    });

    it('throws 400 on invalid input', async () => {
      const dto = { slug: 'invalid-lesson', order: 1, translations: [] };
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
      const dto = {
        slug: 'lesson-slug',
        order: 1,
        translations: validTranslations,
      };
      createLesson.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError('Module not found')),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 404,
        response: 'Module not found',
      });
    });

    it('throws 400 when video not found', async () => {
      const dto = {
        slug: 'lesson-with-video',
        order: 1,
        translations: validTranslations,
        videoId,
      };
      createLesson.execute.mockResolvedValueOnce(
        left(new VideoNotFoundError()),
      );

      await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
        status: 400,
        response: 'Video not found',
      });
    });

    it('throws 500 on repository error', async () => {
      const dto = {
        slug: 'lesson-slug',
        order: 1,
        translations: validTranslations,
      };
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
        undefined as any,
        undefined as any,
        undefined as any,
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

  describe('Get Lesson (GET /:lessonId)', () => {
    const lessonResponse = {
      id: lessonId,
      moduleId,
      video: {
        id: videoId,
        slug: 'video-slug',
        providerVideoId: 'provider-video-id',
        durationInSeconds: 300,
        translations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      imageUrl: '/images/lesson.jpg',
      flashcardIds: ['flash-1'],
      assessments: [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          type: 'quiz',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      commentIds: ['comment-1'],
      translations: validTranslations,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns lesson successfully', async () => {
      getLesson.execute.mockResolvedValueOnce(right(lessonResponse));

      const result = await controller.get(lessonId);

      expect(getLesson.execute).toHaveBeenCalledWith({ id: lessonId });
      expect(result).toEqual(lessonResponse);
    });

    it('returns lesson without optional fields', async () => {
      const minimalLessonResponse = {
        id: lessonId,
        moduleId,
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        translations: [validTranslations[0]],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      getLesson.execute.mockResolvedValueOnce(right(minimalLessonResponse));

      const result = await controller.get(lessonId);

      expect(getLesson.execute).toHaveBeenCalledWith({ id: lessonId });
      expect(result).toEqual(minimalLessonResponse);
      expect(result.video?.id).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
    });

    it('throws 400 on invalid lesson ID', async () => {
      const details = [
        {
          path: ['id'],
          message: 'ID must be a valid UUID',
          code: 'invalid_string',
        },
      ];
      getLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.get('invalid-id')).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 404 when lesson not found', async () => {
      getLesson.execute.mockResolvedValueOnce(left(new LessonNotFoundError()));

      await expect(controller.get(lessonId)).rejects.toMatchObject({
        status: 404,
        response: 'Lesson not found',
      });
    });

    it('throws 500 on repository error', async () => {
      getLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      await expect(controller.get(lessonId)).rejects.toMatchObject({
        status: 500,
        response: 'Database connection failed',
      });
    });

    it('throws 500 on unknown error', async () => {
      getLesson.execute.mockResolvedValueOnce(left(new Error('Unknown error')));

      await expect(controller.get(lessonId)).rejects.toMatchObject({
        status: 500,
        response: 'Unknown error occurred',
      });
    });

    it('verifies lessonId parameter is used correctly', async () => {
      const differentLessonId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      getLesson.execute.mockResolvedValueOnce(right(lessonResponse));

      await controller.get(differentLessonId);

      expect(getLesson.execute).toHaveBeenCalledWith({ id: differentLessonId });
      expect(getLesson.execute).not.toHaveBeenCalledWith({ id: lessonId });
    });
  });

  describe('Update Lesson (PUT /:lessonId)', () => {
    const responseData = {
      id: lessonId,
      moduleId,
      order: 2,
      imageUrl: '/images/updated-lesson.jpg',
      video: {
        id: 'new-video-id',
        slug: 'new-video-slug',
        providerVideoId: 'provider-new-video-id',
        durationInSeconds: 300,
        translations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      flashcardIds: ['flash-1', 'flash-2'],
      assessments: [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          type: 'quiz',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      commentIds: [],
      translations: validTranslations,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedLessonResponse = {
      lesson: {
        id: lessonId,
        moduleId,
        order: 2,
        imageUrl: '/images/updated-lesson.jpg',
        video: {
          id: 'new-video-id',
          slug: 'new-video-slug',
          providerVideoId: 'provider-new-video-id',
          durationInSeconds: 300,
          translations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        flashcardIds: ['flash-1', 'flash-2'],
        assessments: [
          {
            id: 'quiz-1',
            title: 'Quiz 1',
            type: 'quiz',
            passingScore: 70,
            randomizeQuestions: false,
            randomizeOptions: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        commentIds: [],
        translations: validTranslations,
        createdAt: new Date(),
        updatedAt: new Date(),
        toResponseObject: vi.fn().mockReturnValue(responseData),
      },
    };

    it('updates lesson with all fields successfully', async () => {
      const dto = {
        imageUrl: '/images/updated-lesson.jpg',
        translations: validTranslations,
        order: 2,
        videoId: 'new-video-id',
        flashcardIds: ['flash-1', 'flash-2'],
        quizIds: ['quiz-1'],
        commentIds: [],
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: '/images/updated-lesson.jpg',
        translations: validTranslations,
        order: 2,
        videoId: 'new-video-id',
        flashcardIds: ['flash-1', 'flash-2'],
        quizIds: ['quiz-1'],
        assessments: undefined,
        commentIds: [],
      });
      expect(result).toEqual(responseData);
    });

    it('updates lesson with partial fields only', async () => {
      const dto = {
        translations: [validTranslations[0]],
        order: 3,
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: undefined,
        translations: [validTranslations[0]],
        order: 3,
        videoId: undefined,
        flashcardIds: undefined,
        quizIds: undefined,
        assessments: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('handles null values for removal correctly', async () => {
      const dto = {
        imageUrl: null,
        videoId: null,
        flashcardIds: [],
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: null,
        translations: undefined,
        order: undefined,
        videoId: null,
        flashcardIds: [],
        quizIds: undefined,
        assessments: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('updates with relative path imageUrl successfully', async () => {
      const dto = {
        imageUrl: '/assets/lessons/lesson-cover.png',
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: '/assets/lessons/lesson-cover.png',
        translations: undefined,
        order: undefined,
        videoId: undefined,
        flashcardIds: undefined,
        quizIds: undefined,
        assessments: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('updates with full URL imageUrl successfully', async () => {
      const dto = {
        imageUrl: 'https://example.com/images/lesson.jpg',
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: 'https://example.com/images/lesson.jpg',
        translations: undefined,
        order: undefined,
        videoId: undefined,
        flashcardIds: undefined,
        quizIds: undefined,
        assessments: undefined,
        commentIds: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it('updates with empty arrays successfully', async () => {
      const dto = {
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
      };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      const result = await controller.update(lessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: lessonId,
        imageUrl: undefined,
        translations: undefined,
        order: undefined,
        videoId: undefined,
        flashcardIds: [],
        quizIds: [],
        assessments: undefined,
        commentIds: [],
      });
      expect(result).toEqual(responseData);
    });

    it('throws 400 on invalid lesson ID format', async () => {
      const dto = { order: 1 };
      const details = [
        {
          path: ['id'],
          message: 'Lesson ID must be a valid UUID',
          code: 'invalid_string',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.update('invalid-uuid', dto),
      ).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 on invalid imageUrl format', async () => {
      const dto = { imageUrl: 'invalid-path-without-slash' };
      const details = [
        {
          path: ['imageUrl'],
          message:
            'Image URL must be a valid URL or a valid path starting with /',
          code: 'custom',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when no fields provided for update', async () => {
      const dto = {};
      const details = [
        {
          path: [],
          message: 'At least one field must be provided for update',
          code: 'custom',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when translations missing Portuguese', async () => {
      const dto = {
        translations: [
          {
            locale: 'it' as const,
            title: 'Solo Italiano',
            description: 'Desc',
          },
        ],
      };
      const details = [
        {
          path: ['translations'],
          message: 'Portuguese translation is required',
          code: 'custom',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when translations have duplicate locales', async () => {
      const dto = {
        translations: [
          {
            locale: 'pt' as const,
            title: 'Primeiro PT',
            description: 'Desc 1',
          },
          { locale: 'pt' as const, title: 'Segundo PT', description: 'Desc 2' },
        ],
      };
      const details = [
        {
          path: ['translations'],
          message: 'Duplicate locales are not allowed',
          code: 'custom',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when translation title is empty', async () => {
      const dto = {
        translations: [
          { locale: 'pt' as const, title: '', description: 'Desc' },
        ],
      };
      const details = [
        {
          path: ['translations', 0, 'title'],
          message: 'Title is required',
          code: 'too_small',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when order is zero or negative', async () => {
      const dto = { order: 0 };
      const details = [
        {
          path: ['order'],
          message: 'Order must be a positive number',
          code: 'too_small',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 400 when array contains empty IDs', async () => {
      const dto = { flashcardIds: ['valid-id', '', 'another-valid-id'] };
      const details = [
        {
          path: ['flashcardIds', 1],
          message: 'Flashcard ID cannot be empty',
          code: 'too_small',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 404 when lesson not found', async () => {
      const dto = { order: 1 };
      updateLesson.execute.mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 404,
        response: 'Lesson not found',
      });
    });

    it('throws 409 when order conflicts with existing lesson', async () => {
      const dto = { order: 1 };
      updateLesson.execute.mockResolvedValueOnce(
        left(new DuplicateLessonOrderError()),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 409,
        response: 'A lesson with this order already exists in the module',
      });
    });

    it('throws 500 on repository error', async () => {
      const dto = { order: 1 };
      updateLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'Database connection failed',
      });
    });

    it('throws 500 on unknown error', async () => {
      const dto = { order: 1 };
      updateLesson.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error')),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 500,
        response: 'Unknown error occurred',
      });
    });

    it('correctly passes lessonId from URL parameter', async () => {
      const differentLessonId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      const dto = { order: 5 };
      updateLesson.execute.mockResolvedValueOnce(right(updatedLessonResponse));

      await controller.update(differentLessonId, dto);

      expect(updateLesson.execute).toHaveBeenCalledWith({
        id: differentLessonId,
        imageUrl: undefined,
        translations: undefined,
        order: 5,
        videoId: undefined,
        flashcardIds: undefined,
        quizIds: undefined,
        assessments: undefined,
        commentIds: undefined,
      });
      expect(updateLesson.execute).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: lessonId }),
      );
    });

    it('handles complex nested validation errors', async () => {
      const dto = {
        translations: [
          {
            locale: 'pt' as const,
            title: 'A'.repeat(300),
            description: 'Valid',
          },
        ],
        order: -5,
        flashcardIds: ['', 'valid-id'],
      };
      const details = [
        {
          path: ['translations', 0, 'title'],
          message: 'Title must be at most 255 characters',
          code: 'too_big',
        },
        {
          path: ['order'],
          message: 'Order must be a positive number',
          code: 'too_small',
        },
        {
          path: ['flashcardIds', 0],
          message: 'Flashcard ID cannot be empty',
          code: 'too_small',
        },
      ];
      updateLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Multiple validation errors', details)),
      );

      await expect(controller.update(lessonId, dto)).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });
  });

  describe('Delete Lesson (DELETE /:lessonId)', () => {
    it('deletes lesson successfully', async () => {
      const expected = { success: true };
      deleteLesson.execute.mockResolvedValueOnce(right(expected));

      const result = await controller.delete(lessonId);

      expect(deleteLesson.execute).toHaveBeenCalledWith({ id: lessonId });
      expect(result).toEqual(expected);
    });

    it('throws 400 on invalid lesson ID', async () => {
      const details = [
        { path: ['id'], message: 'Invalid UUID', code: 'invalid_string' },
      ];
      deleteLesson.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.delete('invalid-id')).rejects.toMatchObject({
        status: 400,
        response: details,
      });
    });

    it('throws 404 when lesson not found', async () => {
      deleteLesson.execute.mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );

      await expect(controller.delete(lessonId)).rejects.toMatchObject({
        status: 404,
        response: 'Lesson not found',
      });
    });

    it('throws 409 when lesson has dependencies', async () => {
      const deps = {
        canDelete: false,
        totalDependencies: 1,
        summary: {
          videos: 0,
          documents: 0,
          flashcards: 0,
          quizzes: 1,
          comments: 0,
        },
        dependencies: ['quiz'],
      } as any;
      deleteLesson.execute.mockResolvedValueOnce(
        left(new LessonHasDependenciesError(['quiz'], deps)),
      );

      await expect(controller.delete(lessonId)).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({
          message: 'Cannot delete lesson because it has dependencies: quiz',
          dependencyInfo: deps,
        }),
      });
    });

    it('throws 500 on repository error', async () => {
      deleteLesson.execute.mockResolvedValueOnce(
        left(new RepositoryError('DB error')),
      );

      await expect(controller.delete(lessonId)).rejects.toMatchObject({
        status: 500,
        response: 'DB error',
      });
    });
  });
});
