// src/domain/course-catalog/application/use-cases/get-course.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCourseUseCase } from '@/domain/course-catalog/application/use-cases/get-course.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

let repo: InMemoryCourseRepository;
let sut: GetCourseUseCase;

describe('GetCourseUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new GetCourseUseCase(repo);
  });

  function baseCourse(): Course {
    return Course.create(
      {
        slug: 'curso-exemplo',
        translations: [
          {
            locale: 'pt',
            title: 'Curso Exemplo',
            description: 'Descrição Exemplo',
          },
          {
            locale: 'it',
            title: 'Corso Esempio',
            description: 'Descrizione Esempio',
          },
          {
            locale: 'es',
            title: 'Curso Ejemplo',
            description: 'Descripción Ejemplo',
          },
        ],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
  }

  it('returns course when valid ID is provided', async () => {
    const course = baseCourse();
    await repo.create(course);

    const result = await sut.execute({ id: course.id.toString() });
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { course: dto } = result.value;
      expect(dto.id).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      expect(dto.slug).toBe('curso-exemplo');
      expect(dto.translations).toEqual(
        expect.arrayContaining([
          {
            locale: 'pt',
            title: 'Curso Exemplo',
            description: 'Descrição Exemplo',
          },
          {
            locale: 'it',
            title: 'Corso Esempio',
            description: 'Descrizione Esempio',
          },
          {
            locale: 'es',
            title: 'Curso Ejemplo',
            description: 'Descripción Ejemplo',
          },
        ]),
      );
    }
  });

  it('returns InvalidInputError when ID is not a valid UUID', async () => {
    const result = await sut.execute({ id: 'not-a-uuid' as any });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details[0].message).toMatch(/ID must be a valid UUID/);
    }
  });

  it('returns CourseNotFoundError when no course exists for given ID', async () => {
    const result = await sut.execute({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CourseNotFoundError);
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
      expect((result.value as RepositoryError).message).toBe('DB down');
    }
  });
});
