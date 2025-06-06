// src/domain/course-catalog/application/use-cases/list-courses.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';

let repo: InMemoryCourseRepository;
let sut: ListCoursesUseCase;

describe('ListCoursesUseCase (robust)', () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new ListCoursesUseCase(repo);
  });

  it('retorna erro quando repository retorna Left', async () => {
    const fakeError = new Error('falha interna');
    vi.spyOn(repo, 'findAll').mockResolvedValueOnce(left(fakeError) as any);

    const result = await sut.execute();
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBe(fakeError);
    }
  });

  it('retorna erro quando repository lança exceção', async () => {
    vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
      throw new Error('banco indisponível');
    });

    const result = await sut.execute();
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toBe('banco indisponível');
    }
  });

  it('não altera dados de slug ou título ao listar', async () => {
    const course = Course.create(
      {
        slug: 'Meu-Curso-Especial',
        translations: [
          { locale: 'pt', title: 'Título Com Acento', description: 'Descrição qualquer' },
          { locale: 'it', title: 'Titolo Con Accenti', description: 'Qualsiasi' },
          { locale: 'es', title: 'Título Con Acento', description: 'Cualquier' },
        ],
      },
      new UniqueEntityID('44444444-4444-4444-4444-444444444444')
    );
    await repo.create(course);

    const result = await sut.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const listed = result.value.courses;
      expect(listed[0].slug).toBe('Meu-Curso-Especial');
      expect(listed[0].title).toBe('Título Com Acento');
    }
  });

  it('lista corretamente um grande número de cursos', async () => {
    // inserir 100 cursos distintos
    for (let i = 1; i <= 100; i++) {
      const c = Course.create(
        {
          slug: `curso-${i}`,
          translations: [
            { locale: 'pt', title: `Curso ${i}`, description: `Desc ${i}` },
            { locale: 'it', title: `Corso ${i}`, description: `Desc ${i}` },
            { locale: 'es', title: `Curso ${i}`, description: `Desc ${i}` },
          ],
        },
        new UniqueEntityID(`00000000-0000-0000-0000-0000000000${i.toString().padStart(2,'0')}`)
      );
      await repo.create(c);
    }

    const result = await sut.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.courses).toHaveLength(100);
      // opcional: checar primeiro e último slugs
      expect(result.value.courses[0].slug).toBe('curso-1');
      expect(result.value.courses.at(-1)?.slug).toBe('curso-100');
    }
  });
});