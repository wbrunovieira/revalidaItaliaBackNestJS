// src/domain/course-catalog/application/use-cases/get-modules.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetModulesUseCase } from '@/domain/course-catalog/application/use-cases/get-modules.use-case';
import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

let moduleRepo: InMemoryModuleRepository;
let sut: GetModulesUseCase;

const VALID_COURSE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const NO_MODULES_COURSE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('GetModulesUseCase', () => {
  beforeEach(() => {
    moduleRepo = new InMemoryModuleRepository();
    sut = new GetModulesUseCase(moduleRepo as any);
  });

  function makeModule(id: string, slug: string, titlePt: string, titleIt: string, titleEs: string, order: number): Module {
    return Module.create(
      {
        slug,
        translations: [
          { locale: 'pt', title: titlePt, description: 'Desc PT' },
          { locale: 'it', title: titleIt, description: 'Desc IT' },
          { locale: 'es', title: titleEs, description: 'Desc ES' },
        ],
        order,
        videos: [],
      },
      new UniqueEntityID(id)
    );
  }

  it('returns modules list when valid courseId is provided', async () => {
    const mod1 = makeModule(
      '11111111-1111-1111-1111-111111111111',
      'modulo-test',
      'Módulo Teste',
      'Modulo Test',
      'Módulo Prueba',
      1
    );
    const mod2 = makeModule(
      '22222222-2222-2222-2222-222222222222',
      'modulo-sec',
      'Módulo Segundo',
      'Modulo Secondo',
      'Módulo Segundo',
      2
    );


    await moduleRepo.create(VALID_COURSE_ID, mod1);
    await moduleRepo.create(VALID_COURSE_ID, mod2);

    const result = await sut.execute({ courseId: VALID_COURSE_ID });
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { modules } = result.value;
      expect(Array.isArray(modules)).toBe(true);
      expect(modules).toHaveLength(2);

      expect(modules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '11111111-1111-1111-1111-111111111111',
            slug: 'modulo-test',
            order: 1,
            translations: expect.arrayContaining([
              { locale: 'pt', title: 'Módulo Teste', description: 'Desc PT' },
              { locale: 'it', title: 'Modulo Test', description: 'Desc IT' },
              { locale: 'es', title: 'Módulo Prueba', description: 'Desc ES' },
            ]),
          }),
          expect.objectContaining({
            id: '22222222-2222-2222-2222-222222222222',
            slug: 'modulo-sec',
            order: 2,
            translations: expect.arrayContaining([
              { locale: 'pt', title: 'Módulo Segundo', description: 'Desc PT' },
              { locale: 'it', title: 'Modulo Secondo', description: 'Desc IT' },
              { locale: 'es', title: 'Módulo Segundo', description: 'Desc ES' },
            ]),
          }),
        ])
      );
    }
  });

  it('returns empty array if no modules exist for courseId', async () => {
    const result = await sut.execute({ courseId: NO_MODULES_COURSE_ID });
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.modules).toEqual([]);
    }
  });

  it('propagates RepositoryError when repository throws', async () => {
    vi.spyOn(moduleRepo, 'findByCourseId').mockRejectedValueOnce(new Error('DB fail'));
    const result = await sut.execute({ courseId: '33333333-3333-3333-3333-333333333333' });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('DB fail');
    }
  });
});