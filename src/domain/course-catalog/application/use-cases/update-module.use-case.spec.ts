// src/domain/course-catalog/application/use-cases/update-module.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateModuleUseCase } from '@/domain/course-catalog/application/use-cases/update-module.use-case';
import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
import { UpdateModuleRequest } from '@/domain/course-catalog/application/dtos/update-module-request.dto';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { ModuleSlugAlreadyExistsError } from '@/domain/course-catalog/application/use-cases/errors/module-slug-already-exists-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';

let repo: InMemoryModuleRepository;
let sut: UpdateModuleUseCase;

describe('UpdateModuleUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryModuleRepository();
    sut = new UpdateModuleUseCase(repo);
  });

  function createValidModule(
    id?: string,
    slug?: string,
    order: number = 1,
  ): Module {
    const moduleId = id || new UniqueEntityID().toString();

    return Module.create(
      {
        slug: slug || 'modulo-teste',
        imageUrl: 'https://example.com/module.jpg',
        translations: [
          {
            locale: 'pt',
            title: 'Módulo de Teste',
            description: 'Descrição do módulo de teste',
          },
          {
            locale: 'it',
            title: 'Modulo di Test',
            description: 'Descrizione del modulo di test',
          },
          {
            locale: 'es',
            title: 'Módulo de Prueba',
            description: 'Descripción del módulo de prueba',
          },
        ],
        order,
        videos: [],
      },
      new UniqueEntityID(moduleId),
    );
  }

  function validUpdateRequest(
    id: string,
    updates?: Partial<UpdateModuleRequest>,
  ): UpdateModuleRequest {
    return {
      id,
      ...updates,
    };
  }

  describe('Successful updates', () => {
    it('updates module slug successfully', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'novo-slug',
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.slug).toBe('novo-slug');
        expect(result.value.module.id.toString()).toBe(module.id.toString());
      }
    });

    it('updates module imageUrl successfully', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const newImageUrl = 'https://example.com/new-image.jpg';
      const request = validUpdateRequest(module.id.toString(), {
        imageUrl: newImageUrl,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.imageUrl).toBe(newImageUrl);
      }
    });

    it('removes module image when imageUrl is null', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        imageUrl: null,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.imageUrl).toBeUndefined();
      }
    });

    it('updates module translations successfully', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const newTranslations = [
        {
          locale: 'pt' as const,
          title: 'Novo Título',
          description: 'Nova Descrição',
        },
        {
          locale: 'it' as const,
          title: 'Nuovo Titolo',
          description: 'Nuova Descrizione',
        },
        {
          locale: 'es' as const,
          title: 'Nuevo Título',
          description: 'Nueva Descripción',
        },
      ];

      const request = validUpdateRequest(module.id.toString(), {
        translations: newTranslations,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.translations).toEqual(newTranslations);
      }
    });

    it('updates module order successfully', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        order: 5,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.order).toBe(5);
      }
    });

    it('updates multiple fields simultaneously', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'updated-slug',
        imageUrl: 'https://example.com/updated.jpg',
        order: 10,
        translations: [
          {
            locale: 'pt' as const,
            title: 'Título Atualizado',
            description: 'Descrição Atualizada',
          },
          {
            locale: 'it' as const,
            title: 'Titolo Aggiornato',
            description: 'Descrizione Aggiornata',
          },
          {
            locale: 'es' as const,
            title: 'Título Actualizado',
            description: 'Descripción Actualizada',
          },
        ],
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.slug).toBe('updated-slug');
        expect(result.value.module.imageUrl).toBe(
          'https://example.com/updated.jpg',
        );
        expect(result.value.module.order).toBe(10);
        expect(result.value.module.translations[0].title).toBe(
          'Título Atualizado',
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty module ID', async () => {
      const request: any = { id: '', slug: 'new-slug' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Module ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid UUID format', async () => {
      const request: any = { id: 'invalid-uuid', slug: 'new-slug' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Module ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects update without any fields to update', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least one field must be provided for update',
            }),
          ]),
        );
      }
    });

    it('rejects invalid slug format', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId, slug: 'Invalid Slug!' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message:
                'Slug must contain only lowercase letters, numbers, and hyphens',
              path: ['slug'],
            }),
          ]),
        );
      }
    });

    it('rejects empty slug', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId, slug: '' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Slug cannot be empty',
              path: ['slug'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid image URL', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId, imageUrl: 'not-a-url' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Image URL must be a valid URL',
              path: ['imageUrl'],
            }),
          ]),
        );
      }
    });

    it('rejects translations without Portuguese', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = {
        id: moduleId,
        translations: [
          { locale: 'it', title: 'Titolo', description: 'Descrizione' },
          { locale: 'es', title: 'Título', description: 'Descripción' },
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
              message: 'Portuguese translation is required',
              path: ['translations'],
            }),
          ]),
        );
      }
    });

    it('rejects duplicate locales in translations', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = {
        id: moduleId,
        translations: [
          { locale: 'pt', title: 'Título 1', description: 'Descrição 1' },
          { locale: 'pt', title: 'Título 2', description: 'Descrição 2' },
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
              message: 'Duplicate locales are not allowed',
              path: ['translations'],
            }),
          ]),
        );
      }
    });

    it('rejects non-positive order', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId, order: 0 };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Order must be a positive number',
              path: ['order'],
            }),
          ]),
        );
      }
    });

    it('rejects non-integer order', async () => {
      const moduleId = new UniqueEntityID().toString();
      const request: any = { id: moduleId, order: 1.5 };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Order must be an integer',
              path: ['order'],
            }),
          ]),
        );
      }
    });
  });

  describe('Module not found errors', () => {
    it('returns ModuleNotFoundError when module does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validUpdateRequest(nonExistentId, { slug: 'new-slug' });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleNotFoundError;
        expect(error).toBeInstanceOf(ModuleNotFoundError);
        expect(error.message).toBe('Module not found');
      }
    });

    it('handles repository error when finding module', async () => {
      const moduleId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validUpdateRequest(moduleId, { slug: 'new-slug' });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });
  });

  describe('Slug conflicts', () => {
    it('returns ModuleSlugAlreadyExistsError when slug already exists', async () => {
      const courseId = new UniqueEntityID().toString();
      const module1 = createValidModule(undefined, 'existing-slug');
      const module2 = createValidModule(undefined, 'module-to-update');

      await repo.create(courseId, module1);
      await repo.create(courseId, module2);

      const request = validUpdateRequest(module2.id.toString(), {
        slug: 'existing-slug',
      });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleSlugAlreadyExistsError;
        expect(error).toBeInstanceOf(ModuleSlugAlreadyExistsError);
        expect(error.message).toBe(
          'Module with slug "existing-slug" already exists',
        );
      }
    });

    it('allows updating to the same slug', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule(undefined, 'same-slug');
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'same-slug',
        order: 2,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.slug).toBe('same-slug');
        expect(result.value.module.order).toBe(2);
      }
    });

    it('handles repository error when checking slug', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'findBySlug').mockResolvedValueOnce(
        left(new Error('Slug check failed')),
      );

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'new-slug',
      });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Slug check failed');
      }
    });
  });

  describe('Order conflicts', () => {
    it('returns DuplicateModuleOrderError when order already exists in course', async () => {
      const courseId = new UniqueEntityID().toString();
      const module1 = createValidModule(undefined, 'module-1', 1);
      const module2 = createValidModule(undefined, 'module-2', 2);

      await repo.create(courseId, module1);
      await repo.create(courseId, module2);

      const request = validUpdateRequest(module2.id.toString(), {
        order: 1, // Same as module1
      });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DuplicateModuleOrderError;
        expect(error).toBeInstanceOf(DuplicateModuleOrderError);
      }
    });

    it('allows updating to the same order', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule(undefined, 'module', 5);
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        order: 5,
        slug: 'new-slug',
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.order).toBe(5);
        expect(result.value.module.slug).toBe('new-slug');
      }
    });

    it('allows different orders in different courses', async () => {
      const courseId1 = new UniqueEntityID().toString();
      const courseId2 = new UniqueEntityID().toString();

      const module1 = createValidModule(undefined, 'module-1', 1);
      const module2 = createValidModule(undefined, 'module-2', 1);

      await repo.create(courseId1, module1);
      await repo.create(courseId2, module2);

      // Update module2 to order 2 (should succeed as they're in different courses)
      const request = validUpdateRequest(module2.id.toString(), {
        order: 2,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
    });

    it('handles repository error when finding course ID', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'findCourseIdByModuleId').mockResolvedValueOnce(
        left(new Error('Course ID lookup failed')),
      );

      const request = validUpdateRequest(module.id.toString(), {
        order: 10,
      });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Course ID lookup failed');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during update', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'update').mockResolvedValueOnce(
        left(new Error('Update failed')),
      );

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'new-slug',
      });
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Update failed');
      }
    });

    it('handles exception thrown during update', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'update').mockImplementationOnce(() => {
        throw new Error('Unexpected update error');
      });

      const request = validUpdateRequest(module.id.toString(), {
        slug: 'new-slug',
      });
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
    it('handles very long slug within limits', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const longSlug = 'a'.repeat(100); // Max length
      const request = validUpdateRequest(module.id.toString(), {
        slug: longSlug,
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.slug).toBe(longSlug);
      }
    });

    it('rejects slug exceeding max length', async () => {
      const moduleId = new UniqueEntityID().toString();
      const tooLongSlug = 'a'.repeat(101); // Over max length
      const request: any = { id: moduleId, slug: tooLongSlug };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Slug must be at most 100 characters',
              path: ['slug'],
            }),
          ]),
        );
      }
    });

    it('handles partial translation updates', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      // Only update one translation
      const request = validUpdateRequest(module.id.toString(), {
        translations: [
          {
            locale: 'pt' as const,
            title: 'Novo PT',
            description: 'Nova desc PT',
          },
          {
            locale: 'it' as const,
            title: 'Nuovo IT',
            description: 'Nuova desc IT',
          },
          {
            locale: 'es' as const,
            title: 'Nuevo ES',
            description: 'Nueva desc ES',
          },
        ],
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const ptTranslation = result.value.module.translations.find(
          (t) => t.locale === 'pt',
        );
        expect(ptTranslation?.title).toBe('Novo PT');
      }
    });

    it('preserves existing data when updating specific fields', async () => {
      const courseId = new UniqueEntityID().toString();
      const originalImageUrl = 'https://example.com/original.jpg';
      const module = createValidModule();
      module.updateImageUrl(originalImageUrl);
      await repo.create(courseId, module);

      // Update only slug
      const request = validUpdateRequest(module.id.toString(), {
        slug: 'updated-slug-only',
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.slug).toBe('updated-slug-only');
        expect(result.value.module.imageUrl).toBe(originalImageUrl); // Preserved
        expect(result.value.module.order).toBe(1); // Preserved
      }
    });

    it('handles updating module with no initial image', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      module.removeImage(); // Start with no image
      await repo.create(courseId, module);

      const request = validUpdateRequest(module.id.toString(), {
        imageUrl: 'https://example.com/new-image.jpg',
      });
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.module.imageUrl).toBe(
          'https://example.com/new-image.jpg',
        );
      }
    });

    it('handles concurrent updates gracefully', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      // Simulate concurrent updates
      const request1 = validUpdateRequest(module.id.toString(), {
        slug: 'slug-1',
      });
      const request2 = validUpdateRequest(module.id.toString(), {
        slug: 'slug-2',
      });

      const [result1, result2] = await Promise.all([
        sut.execute(request1),
        sut.execute(request2),
      ]);

      // Both should succeed, last one wins
      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      // Check final state
      const finalModule = await repo.findById(module.id.toString());
      if (finalModule.isRight()) {
        // One of them should have won
        expect(['slug-1', 'slug-2']).toContain(finalModule.value.slug);
      }
    });
  });
});
