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
        moduleId: 'module-123',
        videoId: 'video-456',
        imageUrl: 'https://example.com/lesson.jpg',
        flashcardIds: ['flashcard-1', 'flashcard-2'],
        quizIds: ['quiz-1'],
        commentIds: ['comment-1', 'comment-2'],
        translations: [
          {
            locale: 'pt',
            title: 'Aula Exemplo',
            description: 'Descrição da Aula',
          },
          {
            locale: 'it',
            title: 'Lezione Esempio',
            description: 'Descrizione della Lezione',
          },
          {
            locale: 'es',
            title: 'Lección Ejemplo',
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
      expect(dto.moduleId).toBe('module-123');
      expect(dto.videoId).toBe('video-456');
      expect(dto.imageUrl).toBe('https://example.com/lesson.jpg');
      expect(dto.flashcardIds).toEqual(['flashcard-1', 'flashcard-2']);
      expect(dto.quizIds).toEqual(['quiz-1']);
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
            title: 'Lezione Esempio',
            description: 'Descrizione della Lezione',
          },
          {
            locale: 'es',
            title: 'Lección Ejemplo',
            description: 'Descripción de la Lección',
          },
        ]),
      );
      expect(dto.createdAt).toBeInstanceOf(Date);
      expect(dto.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('returns lesson with optional fields as undefined', async () => {
    const lessonWithoutOptionals = Lesson.create(
      {
        moduleId: 'module-456',
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        translations: [{ locale: 'pt', title: 'Aula Simples' }],
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );
    await repo.create(lessonWithoutOptionals);

    const result = await sut.execute({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto).toBeDefined();
      expect(dto.videoId).toBeUndefined();
      expect(dto.imageUrl).toBeUndefined();
      expect(dto.flashcardIds).toEqual([]);
      expect(dto.quizIds).toEqual([]);
      expect(dto.commentIds).toEqual([]);
      expect(dto.translations).toHaveLength(1);
      expect(dto.translations[0].description).toBeUndefined();
    }
  });

  it('returns InvalidInputError when ID is not a valid UUID', async () => {
    const result = await sut.execute({ id: 'not-a-uuid' });

    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value;
      expect(err).toBeInstanceOf(InvalidInputError);
      if (err instanceof InvalidInputError) {
        expect(err.details[0].message).toMatch(/ID must be a valid UUID/);
      }
    }
  });

  it('returns InvalidInputError when ID is empty', async () => {
    const result = await sut.execute({ id: '' });

    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('returns LessonNotFoundError when no lesson exists for given ID', async () => {
    const result = await sut.execute({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    }
  });

  it('propagates RepositoryError when repository throws', async () => {
    vi.spyOn(repo, 'findById').mockRejectedValueOnce(new Error('DB down'));

    const result = await sut.execute({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    });

    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('DB down');
      }
    }
  });

  it('returns lesson with all translation locales', async () => {
    const lesson = baseLesson();
    await repo.create(lesson);

    const result = await sut.execute({ id: lesson.id.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto).toBeDefined();
      expect(dto.translations).toHaveLength(3);

      const locales = dto.translations.map((t) => t.locale);
      expect(locales).toEqual(expect.arrayContaining(['pt', 'it', 'es']));

      // Verificar estrutura de cada tradução
      dto.translations.forEach((translation) => {
        expect(translation).toHaveProperty('locale');
        expect(translation).toHaveProperty('title');
        expect(['pt', 'it', 'es']).toContain(translation.locale);
        expect(typeof translation.title).toBe('string');
        expect(translation.title.length).toBeGreaterThan(0);
      });
    }
  });

  it('returns lesson even when repository returns lesson with minimal data', async () => {
    const minimalLesson = Lesson.create(
      {
        moduleId: 'minimal-module',
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        translations: [{ locale: 'pt', title: 'Título Mínimo' }],
      },
      new UniqueEntityID('dddddddd-dddd-dddd-dddd-dddddddddddd'),
    );
    await repo.create(minimalLesson);

    const result = await sut.execute({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto).toBeDefined();
      expect(dto.moduleId).toBe('minimal-module');
      expect(dto.translations).toHaveLength(1);
      expect(dto.translations[0].locale).toBe('pt');
      expect(dto.translations[0].title).toBe('Título Mínimo');
    }
  });

  it('handles arrays that might be undefined from entity', async () => {
    // Test case para verificar como arrays undefined são tratados
    const lessonWithNullArrays = Lesson.create(
      {
        moduleId: 'module-with-nulls',
        flashcardIds: undefined as any,
        quizIds: undefined as any,
        commentIds: undefined as any,
        translations: [{ locale: 'pt', title: 'Test Title' }],
      },
      new UniqueEntityID('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    );
    await repo.create(lessonWithNullArrays);

    const result = await sut.execute({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const dto = result.value;

      expect(dto).toBeDefined();

      expect(dto.flashcardIds).toBeUndefined();
      expect(dto.quizIds).toBeUndefined();
      expect(dto.commentIds).toBeUndefined();
    }
  });
});
