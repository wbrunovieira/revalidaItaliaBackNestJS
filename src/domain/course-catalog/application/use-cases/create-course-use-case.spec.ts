// src/domain/course-catalog/application/use-cases/create-course-use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCourseUseCase } from '@/domain/course-catalog/application/use-cases/create-course.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { CreateCourseRequest } from '@/domain/course-catalog/application/dtos/create-course-request.dto';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { left } from '@/core/either';

let repo: InMemoryCourseRepository;
let sut: CreateCourseUseCase;

describe('CreateCourseUseCase (multilanguage)', () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new CreateCourseUseCase(repo);
  });

  function baseValidRequest(): CreateCourseRequest {
    return {
      slug: 'matematica-avancada',
      translations: [
        {
          locale: 'pt',
          title: 'Matemática Avançada',
          description: 'Aprofundamento em tópicos de matemática.',
        },
        {
          locale: 'it',
          title: 'Matematica Avanzata',
          description: 'Approfondimento di argomenti di matematica.',
        },
        {
          locale: 'es',
          title: 'Matemáticas Avanzadas',
          description: 'Profundización en temas de matemáticas.',
        },
      ],
    };
  }

  it('creates a multilanguage course successfully', async () => {
    const req = baseValidRequest();
    const result = await sut.execute(req);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { course } = result.value;
      expect(course.id).toMatch(/[0-9a-fA-F\-]{36}/);

      expect(course.slug).toBe('matematica-avancada');
      expect(course.title).toBe('Matemática Avançada');
      expect(course.description).toBe(
        'Aprofundamento em tópicos de matemática.',
      );
      expect(repo.items).toHaveLength(1);
    }
  });

  it('rejects when there is no Portuguese translation for the course', async () => {
    const req: any = {
      slug: 'sem-pt-translation',
      translations: [
        {
          locale: 'it',
          title: 'Curso Italiano',
          description: 'Descrizione it',
        },
        { locale: 'es', title: 'Curso Español', description: 'Descripción es' },
      ],
    };
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'At least a Portuguese translation is required',
            path: expect.arrayContaining(['translations']),
          }),
        ]),
      );
    }
  });

  it('rejects duplicate locale entries in course translations', async () => {
    const req: any = {
      slug: 'duplicate-course-locale',
      translations: [
        { locale: 'pt', title: 'A', description: 'Descrição A' },
        { locale: 'pt', title: 'B', description: 'Descrição B' },
      ],
    };
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Locale duplicado em traduções',
            path: expect.arrayContaining(['translations']),
          }),
        ]),
      );
    }
  });

  it('rejects too-short title/description in a non-Portuguese translation', async () => {
    const req: any = {
      slug: 'short-title-desc',
      translations: [
        { locale: 'pt', title: 'Curso OK', description: 'Descrição válida' },
        { locale: 'it', title: 'Ab', description: 'Desc' },
      ],
    };
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Course title must be at least 3 characters long',
            path: expect.arrayContaining(['translations', 1, 'title']),
          }),
          expect.objectContaining({
            message: 'Course description must be at least 5 characters long',
            path: expect.arrayContaining(['translations', 1, 'description']),
          }),
        ]),
      );
    }
  });

  it('rejects duplicate Portuguese title when creating twice', async () => {
    const req = baseValidRequest();
    await sut.execute(req);
    const again = await sut.execute(req);
    expect(again.isLeft()).toBe(true);

    if (again.isLeft()) {
      expect(again.value).toBeInstanceOf(DuplicateCourseError);
    }
  });

  it('handles repository error on findByTitle', async () => {
    vi.spyOn(repo, 'findByTitle').mockRejectedValueOnce(new Error('DB down'));
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('DB down');
    }
  });

  it('handles Left returned by repository.create', async () => {
    vi.spyOn(repo, 'create').mockResolvedValueOnce(
      left(new Error('Insert failed')) as any,
    );
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('Insert failed');
    }
  });

  it('handles exception thrown by repository.create', async () => {
    vi.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw new Error('Create exception');
    });
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('Create exception');
    }
  });

  it('normalizes slug to lowercase', async () => {
    const req = baseValidRequest();
    // Use uppercase & spaces to test normalization
    req.slug = 'My-COURSE Slug';
    const result = await sut.execute(req);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { course } = result.value;
      // VO should convert to lowercase and replace spaces
      expect(course.slug).toBe('my-course-slug');
    }
  });
});
