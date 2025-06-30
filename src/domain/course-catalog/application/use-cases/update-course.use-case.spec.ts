// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/update-course.use-case.spec.ts
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateCourseUseCase } from '@/domain/course-catalog/application/use-cases/update-course.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { UpdateCourseRequest } from '@/domain/course-catalog/application/dtos/update-course-request.dto';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { CourseNotModifiedError } from '@/domain/course-catalog/application/use-cases/errors/course-not-modified-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';

let repo: InMemoryCourseRepository;
let sut: UpdateCourseUseCase;

describe('UpdateCourseUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new UpdateCourseUseCase(repo);
  });

  function createValidCourse(id?: string): Course {
    const courseId = id || new UniqueEntityID().toString();
    return Course.create(
      {
        slug: 'curso-original',
        imageUrl: '/original-image.jpg',
        translations: [
          {
            locale: 'pt',
            title: 'Curso Original',
            description: 'Descrição original do curso',
          },
          {
            locale: 'it',
            title: 'Corso Originale',
            description: 'Descrizione originale del corso',
          },
        ],
      },
      new UniqueEntityID(courseId),
    );
  }

  function validUpdateRequest(
    id: string,
    overrides: Partial<UpdateCourseRequest> = {},
  ): UpdateCourseRequest {
    return {
      id,
      slug: 'curso-atualizado',
      translations: [
        {
          locale: 'pt',
          title: 'Curso Atualizado',
          description: 'Descrição atualizada do curso',
        },
        {
          locale: 'it',
          title: 'Corso Aggiornato',
          description: 'Descrizione aggiornata del corso',
        },
      ],
      ...overrides,
    };
  }

  describe('Successful updates', () => {
    it('updates course successfully with all fields', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request = validUpdateRequest(course.id.toString(), {
        imageUrl: '/new-image.jpg',
      });

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.slug).toBe('curso-atualizado');
        expect(result.value.course.title).toBe('Curso Atualizado');
        expect(result.value.course.description).toBe(
          'Descrição atualizada do curso',
        );
        expect(result.value.course.imageUrl).toBe('/new-image.jpg');
        expect(result.value.course.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('updates only slug', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: 'novo-slug',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.slug).toBe('novo-slug');
        expect(result.value.course.title).toBe('Curso Original'); // Não mudou
        expect(result.value.course.imageUrl).toBe('/original-image.jpg'); // Não mudou
      }
    });

    it('updates only imageUrl', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        imageUrl: '/nova-imagem.jpg',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.imageUrl).toBe('/nova-imagem.jpg');
        expect(result.value.course.slug).toBe('curso-original'); // Não mudou
      }
    });

    it('updates only translations', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Novo Título',
            description: 'Nova descrição',
          },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.title).toBe('Novo Título');
        expect(result.value.course.description).toBe('Nova descrição');
        expect(result.value.course.slug).toBe('curso-original'); // Não mudou
      }
    });

    it('removes imageUrl when set to empty string', async () => {
      const course = createValidCourse();
      await repo.create(course);

      // Implementar o método update no InMemoryRepository primeiro
      if (!repo.update) {
        // Adicionar método temporário para o teste
        (repo as any).update = async (course: Course) => {
          const index = repo.items.findIndex(
            (item) => item.id.toString() === course.id.toString(),
          );
          if (index === -1) {
            return left(new Error('Course not found'));
          }
          repo.items[index] = course;
          return right(undefined);
        };

        (repo as any).findBySlugExcludingId = async (
          slug: string,
          excludeId: string,
        ) => {
          const found = repo.items.find(
            (course) =>
              course.slug === slug && course.id.toString() !== excludeId,
          );
          return found ? right(found) : left(new Error('Course not found'));
        };

        (repo as any).findByTitleExcludingId = async (
          title: string,
          excludeId: string,
        ) => {
          const found = repo.items.find(
            (course) =>
              course.title === title && course.id.toString() !== excludeId,
          );
          return found ? right(found) : left(new Error('Course not found'));
        };
      }

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        imageUrl: '',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.imageUrl).toBe('');
      }
    });

    it('normalizes slug to lowercase', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: 'CURSO-COM-MAIUSCULAS',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.slug).toBe('curso-com-maiusculas');
      }
    });

    it('updates timestamp correctly', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const originalUpdatedAt = course.updatedAt;

      // Aguardar um pouco para garantir diferença de timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: 'slug-novo',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty course ID', async () => {
      const request: any = { id: '', slug: 'test' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Course ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid UUID format', async () => {
      const request: any = { id: 'invalid-uuid', slug: 'test' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Course ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects update without any fields', async () => {
      const request: any = { id: new UniqueEntityID().toString() };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least one field must be provided for update',
              path: ['root'],
            }),
          ]),
        );
      }
    });

    it('rejects translations without Portuguese', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          { locale: 'it', title: 'Corso Italiano', description: 'Descrizione' },
          { locale: 'es', title: 'Curso Español', description: 'Descripción' },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least a Portuguese translation is required',
              path: expect.arrayContaining(['translations']),
            }),
          ]),
        );
      }
    });

    it('rejects duplicate locales in translations', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          { locale: 'pt', title: 'Curso A', description: 'Descrição A' },
          { locale: 'pt', title: 'Curso B', description: 'Descrição B' },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Locale duplicado em traduções',
              path: expect.arrayContaining(['translations']),
            }),
          ]),
        );
      }
    });

    it('rejects too-short title in translations', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          { locale: 'pt', title: 'AB', description: 'Descrição válida' },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Course title must be at least 3 characters long',
              path: expect.arrayContaining(['translations', 0, 'title']),
            }),
          ]),
        );
      }
    });
  });

  describe('Course not found errors', () => {
    it('returns CourseNotFoundError when course does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validUpdateRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseNotFoundError;
        expect(error).toBeInstanceOf(CourseNotFoundError);
      }
    });

    it('handles repository error when finding course', async () => {
      const courseId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database down'),
      );

      const request = validUpdateRequest(courseId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database down');
      }
    });
  });

  describe('No modifications detected', () => {
    it('returns CourseNotModifiedError when no changes detected', async () => {
      const course = createValidCourse();
      await repo.create(course);

      // Enviar os mesmos dados
      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: course.slug,
        imageUrl: course.imageUrl,
        translations: course.translations,
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseNotModifiedError;
        expect(error).toBeInstanceOf(CourseNotModifiedError);
        expect(error.message).toBe('No changes detected in course data');
      }
    });

    it('detects changes when only one field differs', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: course.slug,
        imageUrl: course.imageUrl,
        translations: [
          {
            locale: 'pt',
            title: 'Título Diferente', // Mudança aqui
            description: course.translations[0].description,
          },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true); // Deve detectar a mudança
    });
  });

  describe('Duplicate course errors', () => {
    it('returns DuplicateCourseError when slug already exists', async () => {
      const course1 = createValidCourse();
      const course2 = Course.create({
        slug: 'outro-curso',
        translations: [
          {
            locale: 'pt',
            title: 'Outro Curso',
            description: 'Outra descrição',
          },
        ],
      });

      await repo.create(course1);
      await repo.create(course2);

      const request: UpdateCourseRequest = {
        id: course1.id.toString(),
        slug: 'outro-curso', // Slug que já existe no course2
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DuplicateCourseError;
        expect(error).toBeInstanceOf(DuplicateCourseError);
      }
    });

    it('returns DuplicateCourseError when Portuguese title already exists', async () => {
      const course1 = createValidCourse();
      const course2 = Course.create({
        slug: 'outro-curso',
        translations: [
          {
            locale: 'pt',
            title: 'Título Existente',
            description: 'Outra descrição',
          },
        ],
      });

      await repo.create(course1);
      await repo.create(course2);

      const request: UpdateCourseRequest = {
        id: course1.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Título Existente',
            description: 'Nova descrição',
          },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DuplicateCourseError;
        expect(error).toBeInstanceOf(DuplicateCourseError);
      }
    });

    it('allows updating to same slug (no change)', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        slug: course.slug, // Mesmo slug
        translations: [
          { locale: 'pt', title: 'Novo Título', description: 'Nova descrição' },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true); // Deve permitir
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during update', async () => {
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'update').mockResolvedValueOnce(
        left(new Error('Update failed')),
      );

      const request = validUpdateRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Update failed');
      }
    });

    it('handles exception thrown during update', async () => {
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'update').mockImplementationOnce(() => {
        throw new Error('Unexpected update error');
      });

      const request = validUpdateRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected update error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles updating course with undefined imageUrl to defined', async () => {
      const course = Course.create({
        slug: 'curso-sem-imagem',
        translations: [
          { locale: 'pt', title: 'Curso', description: 'Descrição' },
        ],
        // imageUrl undefined
      });
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        imageUrl: '/nova-imagem.jpg',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.imageUrl).toBe('/nova-imagem.jpg');
      }
    });

    it('handles updating course with defined imageUrl to undefined', async () => {
      const course = createValidCourse();
      await repo.create(course);

      // Implementar o método update no InMemoryRepository primeiro
      if (!repo.update) {
        // Adicionar método temporário para o teste
        (repo as any).update = async (course: Course) => {
          const index = repo.items.findIndex(
            (item) => item.id.toString() === course.id.toString(),
          );
          if (index === -1) {
            return left(new Error('Course not found'));
          }
          repo.items[index] = course;
          return right(undefined);
        };

        (repo as any).findBySlugExcludingId = async (
          slug: string,
          excludeId: string,
        ) => {
          const found = repo.items.find(
            (course) =>
              course.slug === slug && course.id.toString() !== excludeId,
          );
          return found ? right(found) : left(new Error('Course not found'));
        };

        (repo as any).findByTitleExcludingId = async (
          title: string,
          excludeId: string,
        ) => {
          const found = repo.items.find(
            (course) =>
              course.title === title && course.id.toString() !== excludeId,
          );
          return found ? right(found) : left(new Error('Course not found'));
        };
      }

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        imageUrl: undefined,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.imageUrl).toBeUndefined();
      }
    });

    it('handles updating with fewer translations than original', async () => {
      const course = createValidCourse(); // Tem pt e it
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Só Português',
            description: 'Só em português agora',
          },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.title).toBe('Só Português');
      }
    });

    it('handles updating with more translations than original', async () => {
      const course = Course.create({
        slug: 'curso-uma-traducao',
        translations: [
          { locale: 'pt', title: 'Só PT', description: 'Só português' },
        ],
      });
      await repo.create(course);

      const request: UpdateCourseRequest = {
        id: course.id.toString(),
        translations: [
          { locale: 'pt', title: 'Português', description: 'Em português' },
          { locale: 'it', title: 'Italiano', description: 'In italiano' },
          { locale: 'es', title: 'Español', description: 'En español' },
        ],
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.course.title).toBe('Português');
      }
    });
  });
});
