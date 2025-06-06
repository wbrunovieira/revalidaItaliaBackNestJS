// test/integration/create-module.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { CreateModuleRequest } from '@/domain/course-catalog/application/dtos/create-module-request.dto';

let courseRepo: InMemoryCourseRepository;
let moduleRepo: InMemoryModuleRepository;
let sut: CreateModuleUseCase;

describe('CreateModuleUseCase', () => {
  beforeEach(() => {
    courseRepo = new InMemoryCourseRepository();
    moduleRepo = new InMemoryModuleRepository();
    sut = new CreateModuleUseCase(courseRepo as any, moduleRepo as any);
  });

  function baseCourse(): Course {
    return Course.create(
      {
        slug: 'curso-principal',
        translations: [
          { locale: 'pt', title: 'Curso Principal', description: 'Descrição Principal' },
          { locale: 'it', title: 'Corso Principale', description: 'Descrizione Principale' },
          { locale: 'es', title: 'Curso Principal', description: 'Descripción Principal' },
        ],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    );
  }

  function baseRequest(courseId: string): CreateModuleRequest {
    return {
      courseId,
      slug: 'modulo-exemplo',
      translations: [
        { locale: 'pt', title: 'Módulo Exemplo', description: 'Descrição Módulo' },
        { locale: 'it', title: 'Modulo Esempio', description: 'Descrizione Modulo' },
        { locale: 'es', title: 'Módulo Ejemplo', description: 'Descripción Módulo' },
      ],
      order: 1,
    };
  }

  it('creates a module successfully', async () => {
    const course = baseCourse();
    await courseRepo.create(course);

    const req = baseRequest(course.id.toString());
    const result = await sut.execute(req);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { module } = result.value;
      expect(module.id).toMatch(/[0-9a-fA-F\-]{36}/);
      expect(module.slug).toBe('modulo-exemplo');
      expect(module.order).toBe(1);
      expect(module.translations).toEqual(
        expect.arrayContaining([
          { locale: 'pt', title: 'Módulo Exemplo', description: 'Descrição Módulo' },
          { locale: 'it', title: 'Modulo Esempio', description: 'Descrizione Modulo' },
          { locale: 'es', title: 'Módulo Ejemplo', description: 'Descripción Módulo' },
        ])
      );
      expect(moduleRepo.items).toHaveLength(1);
      expect(moduleRepo.items[0].courseId).toBe(course.id.toString());
    }
  });

  it('rejects when course does not exist', async () => {
    const req = baseRequest('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CourseNotFoundError);
    }
  });

  it('rejects duplicate module order for same course', async () => {
    const course = baseCourse();
    await courseRepo.create(course);

    const req1 = baseRequest(course.id.toString());
    await sut.execute(req1);

    const req2 = baseRequest(course.id.toString()); // same order=1
    const result2 = await sut.execute(req2);
    expect(result2.isLeft()).toBe(true);

    if (result2.isLeft()) {
      expect(result2.value).toBeInstanceOf(DuplicateModuleOrderError);
    }
  });

  it('rejects invalid input (missing PT translation)', async () => {
    const course = baseCourse();
    await courseRepo.create(course);

    const badReq: any = {
      courseId: course.id.toString(),
      slug: 'mod-bad',
      translations: [
        { locale: 'it', title: 'Bad', description: 'Bad desc' },
      ],
      order: 1,
    };
    const result = await sut.execute(badReq);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'At least a Portuguese translation is required',
            path: expect.arrayContaining(['translations']),
          }),
        ])
      );
    }
  });

  it('handles repository error on findById', async () => {
    vi.spyOn(courseRepo, 'findById').mockRejectedValueOnce(new Error('DB down'));
    const req = baseRequest('cccccccc-cccc-cccc-cccc-cccccccccccc');
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('DB down');
    }
  });

  it('handles repository error on findByCourseIdAndOrder', async () => {
    const course = baseCourse();
    await courseRepo.create(course);
    vi.spyOn(moduleRepo, 'findByCourseIdAndOrder').mockRejectedValueOnce(new Error('Error O'));

    const req = baseRequest(course.id.toString());
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('Error O');
    }
  });

  it('handles repository error on create', async () => {
    const course = baseCourse();
    await courseRepo.create(course);
    vi.spyOn(moduleRepo, 'create').mockResolvedValueOnce(left(new Error('Insert fail')) as any);

    const req = baseRequest(course.id.toString());
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('Insert fail');
    }
  });
});