// src/domain/course-catalog/application/use-cases/list-courses.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';
import { RepositoryError } from './errors/repository-error';

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
      // ✅ CORREÇÃO 1: Verificar que é RepositoryError com mensagem correta
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('falha interna');
    }
  });

  it('retorna erro quando repository lança exceção', async () => {
    vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
      throw new Error('banco indisponível');
    });

    const result = await sut.execute();
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('banco indisponível');
    }
  });

  it('não altera dados de slug ou título ao listar', async () => {
    const course = Course.create(
      {
        slug: 'Meu-Curso-Especial',
        translations: [
          {
            locale: 'pt',
            title: 'Título Com Acento',
            description: 'Descrição qualquer',
          },
          {
            locale: 'it',
            title: 'Titolo Con Accenti',
            description: 'Qualsiasi',
          },
          {
            locale: 'es',
            title: 'Título Con Acento',
            description: 'Cualquier',
          },
        ],
      },
      new UniqueEntityID('44444444-4444-4444-4444-444444444444'),
    );
    await repo.create(course);

    const result = await sut.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const listed = result.value.courses;
      expect(listed[0].slug).toBe('Meu-Curso-Especial');

      // ✅ CORREÇÃO 2: Acessar title através de translations
      const ptTranslation = listed[0].translations.find(
        (t) => t.locale === 'pt',
      );
      expect(ptTranslation?.title).toBe('Título Com Acento');
      expect(ptTranslation?.description).toBe('Descrição qualquer');

      // ✅ Verificar que todas as traduções estão presentes
      expect(listed[0].translations).toHaveLength(3);
      expect(listed[0].translations.map((t) => t.locale)).toEqual(
        expect.arrayContaining(['pt', 'it', 'es']),
      );
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
        new UniqueEntityID(
          `00000000-0000-0000-0000-0000000000${i.toString().padStart(2, '0')}`,
        ),
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

      // ✅ Verificar estrutura das traduções em alguns cursos
      const firstCourse = result.value.courses[0];
      expect(firstCourse.translations).toHaveLength(3);
      const ptTranslation = firstCourse.translations.find(
        (t) => t.locale === 'pt',
      );
      expect(ptTranslation?.title).toBe('Curso 1');
    }
  });

  // ✅ TESTE ADICIONAL: Verificar curso com imageUrl
  it('retorna imageUrl quando presente e undefined quando ausente', async () => {
    // Curso sem imageUrl
    const courseWithoutImage = Course.create({
      slug: 'curso-sem-imagem',
      translations: [
        { locale: 'pt', title: 'Curso Sem Imagem', description: 'Desc' },
      ],
    });
    await repo.create(courseWithoutImage);

    // Curso com imageUrl
    const courseWithImage = Course.create({
      slug: 'curso-com-imagem',
      imageUrl: 'https://example.com/image.jpg',
      translations: [
        { locale: 'pt', title: 'Curso Com Imagem', description: 'Desc' },
      ],
    });
    await repo.create(courseWithImage);

    const result = await sut.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const courses = result.value.courses;
      expect(courses).toHaveLength(2);

      // Verificar que imageUrl é undefined quando não existe
      const courseWithoutImg = courses.find(
        (c) => c.slug === 'curso-sem-imagem',
      );
      expect(courseWithoutImg?.imageUrl).toBeUndefined();

      // Verificar que imageUrl é retornado quando existe
      const courseWithImg = courses.find((c) => c.slug === 'curso-com-imagem');
      expect(courseWithImg?.imageUrl).toBe('https://example.com/image.jpg');
    }
  });
});
