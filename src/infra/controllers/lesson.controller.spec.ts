// src/infra/course-catalog/controllers/lesson.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { left, right } from '@/core/either';
import { TranslationDto } from '@/domain/course-catalog/application/dtos/translation.dto';

describe('LessonController', () => {
  let controller: LessonController;
  let createLesson: { execute: ReturnType<typeof vi.fn> };

  const moduleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const validTranslations: TranslationDto[] = [
    { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
    { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
    { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
  ];
  const dto = { translations: validTranslations };

  beforeEach(() => {
    createLesson = { execute: vi.fn() };
    controller = new LessonController(createLesson as any);
  });

  it('→ returns created lesson on success', async () => {
    const expected = {
      lesson: {
        id: 'lesson-1',
        moduleId,
        translations: validTranslations,
      },
    };
    createLesson.execute.mockResolvedValueOnce(right(expected));

    const result = await controller.create(moduleId, dto);
    expect(createLesson.execute).toHaveBeenCalledWith({ moduleId, translations: validTranslations });
    expect(result).toEqual(expected.lesson);
  });

  it('→ throws BadRequestException on invalid input', async () => {
    // drop one translation to trigger validation error
    const badDto = { translations: validTranslations.slice(0, 2) };
    const details = [{ path: ['translations'], message: 'Exactly three translations required' }];
    createLesson.execute.mockResolvedValueOnce(left(new InvalidInputError('Validation failed', details)));

    await expect(controller.create(moduleId, badDto as any)).rejects.toMatchObject({
      status: 400,
      response: details,
    });
  });

  it('→ throws NotFoundException if module not found', async () => {
    createLesson.execute.mockResolvedValueOnce(left(new ModuleNotFoundError('Module not found')));

    await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
      status: 404,
      response: 'Module not found',
    });
  });

  it('→ throws InternalServerErrorException on repository error', async () => {
    createLesson.execute.mockResolvedValueOnce(left(new RepositoryError('DB down')));

    await expect(controller.create(moduleId, dto)).rejects.toMatchObject({
      status: 500,
      response: 'DB down',
    });
  });
});