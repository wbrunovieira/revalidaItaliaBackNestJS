// src/domain/course-catalog/application/use-cases/get-lesson.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetLessonUseCase } from '@/domain/course-catalog/application/use-cases/get-lesson.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

let repo: InMemoryLessonRepository;
let sut: GetLessonUseCase;

describe('GetLessonUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryLessonRepository();
    sut = new GetLessonUseCase(repo);
  });

  function baseLesson(): Lesson {
    return Lesson.create(
      {
        slug: 'lesson-example',
        moduleId: 'module-123',
        order: 1,
        imageUrl: 'https://example.com/lesson.jpg',
        flashcardIds: ['flashcard-1', 'flashcard-2'],
        commentIds: ['comment-1', 'comment-2'],
        translations: [
          {
            locale: 'pt',
            title: 'Aula Exemplo',
            description: 'Descrição da Aula',
          },
          {
            locale: 'it',
            title: 'Lezione Exemplo',
            description: 'Descrizione della Lezione',
          },
          {
            locale: 'es',
            title: 'Lección Exemplo',
            description: 'Descripción de la Lección',
          },
        ],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
  }

  it('returns lesson when valid ID is provided', async () => {
    const lesson = baseLesson();
    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto).toBeDefined();
      expect(dto.id).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      expect(dto.slug).toBe('lesson-example');
      expect(dto.moduleId).toBe('module-123');
      expect(dto.order).toBe(1);
      expect(dto.imageUrl).toBe('https://example.com/lesson.jpg');
      expect(dto.flashcardIds).toEqual(['flashcard-1', 'flashcard-2']);
      expect(dto.commentIds).toEqual(['comment-1', 'comment-2']);
      expect(dto.translations).toEqual(
        expect.arrayContaining([
          {
            locale: 'pt',
            title: 'Aula Exemplo',
            description: 'Descrição da Aula',
          },
          {
            locale: 'it',
            title: 'Lezione Exemplo',
            description: 'Descrizione della Lezione',
          },
          {
            locale: 'es',
            title: 'Lección Exemplo',
            description: 'Descripción de la Lección',
          },
        ]),
      );
      expect(dto.videos).toEqual([]);
      expect(dto.documents).toEqual([]);
      expect(dto.assessments).toEqual([]);
      expect(dto.video).toBeUndefined();
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('returns lesson with optional fields as undefined', async () => {
    const lesson = Lesson.create(
      {
        slug: 'minimal-lesson',
        moduleId: 'module-minimal',
        order: 1,
        flashcardIds: [],
        commentIds: [],
        translations: [
          {
            locale: 'pt',
            title: 'Minimal Lesson',
            description: 'Minimal description',
          },
        ],
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );

    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto.id).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      expect(dto.slug).toBe('minimal-lesson');
      expect(dto.moduleId).toBe('module-minimal');
      expect(dto.order).toBe(1);
      expect(dto.imageUrl).toBeUndefined();
      expect(dto.flashcardIds).toEqual([]);
      expect(dto.commentIds).toEqual([]);
      expect(dto.translations).toHaveLength(1);
      expect(dto.videos).toEqual([]);
      expect(dto.documents).toEqual([]);
      expect(dto.assessments).toEqual([]);
      expect(dto.video).toBeUndefined();
    }
  });

  it('returns InvalidInputError when ID is not a valid UUID', async () => {
    const result = await sut.execute({ id: 'invalid-uuid' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('returns InvalidInputError when ID is empty', async () => {
    const result = await sut.execute({ id: '' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('returns LessonNotFoundError when no lesson exists for given ID', async () => {
    const result = await sut.execute({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('propagates RepositoryError when repository throws', async () => {
    vi.spyOn(repo, 'findById').mockRejectedValue(new Error('Database error'));

    const result = await sut.execute({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  it('returns lesson with all translation locales', async () => {
    const lesson = baseLesson();
    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;
      expect(dto.translations).toHaveLength(3);
      expect(dto.translations.map((t) => t.locale)).toEqual(
        expect.arrayContaining(['pt', 'it', 'es']),
      );
    }
  });

  it('returns lesson even when repository returns lesson with minimal data', async () => {
    const lesson = Lesson.create(
      {
        slug: 'test-lesson',
        moduleId: 'test-module',
        order: 1,
        flashcardIds: [],
        commentIds: [],
        translations: [
          {
            locale: 'pt',
            title: 'Test',
          },
        ],
      },
      new UniqueEntityID('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    );

    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;
      expect(dto.translations[0].description).toBeUndefined();
    }
  });

  it('handles arrays that might be undefined from entity', async () => {
    const lesson = Lesson.create(
      {
        slug: 'array-test',
        moduleId: 'module-array',
        order: 1,
        flashcardIds: [],
        commentIds: [],
        translations: [
          {
            locale: 'pt',
            title: 'Array Test',
          },
        ],
      },
      new UniqueEntityID('ffffffff-ffff-ffff-ffff-ffffffffffff'),
    );

    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;
      expect(Array.isArray(dto.flashcardIds)).toBe(true);
      expect(Array.isArray(dto.commentIds)).toBe(true);
      expect(Array.isArray(dto.translations)).toBe(true);
      expect(Array.isArray(dto.videos)).toBe(true);
      expect(Array.isArray(dto.documents)).toBe(true);
      expect(Array.isArray(dto.assessments)).toBe(true);
    }
  });
});
