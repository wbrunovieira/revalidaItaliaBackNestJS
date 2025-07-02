// src/domain/course-catalog/application/use-cases/delete-module.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteModuleUseCase } from '@/domain/course-catalog/application/use-cases/delete-module.use-case';
import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
import { DeleteModuleRequest } from '@/domain/course-catalog/application/dtos/delete-module-request.dto';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { ModuleHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/module-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import { ModuleDependencyInfo } from '@/domain/course-catalog/application/dtos/module-dependencies.dto';

let repo: InMemoryModuleRepository;
let sut: DeleteModuleUseCase;

describe('DeleteModuleUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryModuleRepository();
    sut = new DeleteModuleUseCase(repo);
  });

  function createValidModule(id?: string, order: number = 1): Module {
    const moduleId = id || new UniqueEntityID().toString();

    return Module.create(
      {
        slug: 'modulo-teste',
        imageUrl: 'https://example.com/module.jpg',
        translations: [
          {
            locale: 'pt',
            title: 'Módulo de Teste',
            description: 'Descrição do módulo de teste',
          },
        ],
        order,
        videos: [],
      },
      new UniqueEntityID(moduleId),
    );
  }

  function validDeleteRequest(id?: string): DeleteModuleRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a module successfully when it exists and has no dependencies', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Module deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('returns success message with current timestamp', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);
      const afterDeletion = new Date();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.deletedAt.getTime()).toBeGreaterThanOrEqual(
          beforeDeletion.getTime(),
        );
        expect(result.value.deletedAt.getTime()).toBeLessThanOrEqual(
          afterDeletion.getTime(),
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty module ID', async () => {
      const request: any = { id: '' };
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

    it('rejects missing module ID', async () => {
      const request: any = {};
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
      const request: any = { id: 'invalid-uuid' };
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

    it('rejects non-string module ID', async () => {
      const request: any = { id: 123 };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects null module ID', async () => {
      const request: any = { id: null };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'null',
              path: ['id'],
            }),
          ]),
        );
      }
    });
  });

  describe('Module not found errors', () => {
    it('returns ModuleNotFoundError when module does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
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

      const request = validDeleteRequest(moduleId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const moduleId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Module lookup failed')),
      );

      const request = validDeleteRequest(moduleId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleNotFoundError;
        expect(error).toBeInstanceOf(ModuleNotFoundError);
        expect(error.message).toBe('Module not found');
      }
    });
  });

  describe('Module dependencies errors', () => {
    it('returns ModuleHasDependenciesError when module has lessons', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      // Adicionar dependências simuladas
      repo.addDependenciesToModule(module.id.toString(), {
        lessons: [
          {
            id: '1',
            title: 'Lesson 1',
            videos: [1, 2],
            documents: [1],
            flashcards: [],
            quizzes: [1],
          },
          {
            id: '2',
            title: 'Lesson 2',
            videos: [3, 4, 5],
            documents: [],
            flashcards: [1, 2],
            quizzes: [],
          },
        ],
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleHasDependenciesError;
        expect(error).toBeInstanceOf(ModuleHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete module because it has dependencies',
        );
        expect(error.message).toContain('Lesson 1');
        expect(error.message).toContain('Lesson 2');
      }
    });

    it('returns ModuleHasDependenciesError when module has videos', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      // Adicionar vídeos como dependências
      repo.addDependenciesToModule(module.id.toString(), {
        videos: [
          { id: '1', title: 'Introduction Video' },
          { id: '2', title: 'Tutorial Video' },
        ],
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleHasDependenciesError;
        expect(error).toBeInstanceOf(ModuleHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete module because it has dependencies',
        );
        expect(error.message).toContain('Introduction Video');
        expect(error.message).toContain('Tutorial Video');
      }
    });

    it('returns ModuleHasDependenciesError when module has both lessons and videos', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      repo.addDependenciesToModule(module.id.toString(), {
        lessons: [{ id: '1', title: 'Advanced Lesson', videos: [1, 2] }],
        videos: [{ id: '2', title: 'Module Overview' }],
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleHasDependenciesError;
        expect(error).toBeInstanceOf(ModuleHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete module because it has dependencies',
        );
        expect(error.message).toContain('Advanced Lesson');
        expect(error.message).toContain('Module Overview');
      }
    });

    it('includes dependency info in error for frontend usage', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      repo.addDependenciesToModule(module.id.toString(), {
        lessons: [
          {
            id: '1',
            title: 'Test Lesson',
            videos: [1, 2, 3],
            documents: [1, 2],
            flashcards: [1],
            quizzes: [1, 2, 3, 4],
          },
        ],
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleHasDependenciesError;
        expect(error).toBeInstanceOf(ModuleHasDependenciesError);

        // Verificar se a informação extra está disponível
        const errorWithInfo = error as any;
        expect(errorWithInfo.dependencyInfo).toBeDefined();
        expect(errorWithInfo.dependencyInfo.canDelete).toBe(false);
        expect(errorWithInfo.dependencyInfo.totalDependencies).toBeGreaterThan(
          0,
        );
        expect(errorWithInfo.dependencyInfo.summary.lessons).toBe(1);

        // Verificar detalhes das entidades relacionadas
        const lessonDep = errorWithInfo.dependencyInfo.dependencies.find(
          (d: any) => d.type === 'lesson',
        );
        expect(lessonDep?.relatedEntities?.videos).toBe(3);
        expect(lessonDep?.relatedEntities?.documents).toBe(2);
        expect(lessonDep?.relatedEntities?.flashcards).toBe(1);
        expect(lessonDep?.relatedEntities?.quizzes).toBe(4);
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'checkModuleDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Dependencies check failed');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during module lookup', async () => {
      const moduleId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(moduleId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected lookup error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles module with no dependencies', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Module deleted successfully');
      }
    });

    it('handles module with empty dependency arrays', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      repo.addDependenciesToModule(module.id.toString(), {
        lessons: [],
        videos: [],
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Module deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as ModuleNotFoundError;
        expect(error).toBeInstanceOf(ModuleNotFoundError);
        expect(error.message).toBe('Module not found');
      }
    });

    it('handles exception during dependencies check', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      vi.spyOn(repo, 'checkModuleDependencies').mockImplementationOnce(() => {
        throw new Error('Unexpected dependencies check error');
      });

      const request = validDeleteRequest(module.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected dependencies check error');
      }
    });

    it('verifies dependency information structure', async () => {
      const courseId = new UniqueEntityID().toString();
      const module = createValidModule();
      await repo.create(courseId, module);

      repo.addDependenciesToModule(module.id.toString(), {
        lessons: [
          {
            id: '1',
            title: 'Lesson 1',
            videos: [1, 2, 3, 4, 5],
            documents: [1, 2],
            flashcards: [1, 2, 3],
            quizzes: [1],
          },
        ],
        videos: [{ id: 'v1', title: 'Module Intro' }],
      });

      // Testar o método checkModuleDependencies diretamente
      const dependenciesResult = await repo.checkModuleDependencies(
        module.id.toString(),
      );

      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(2);
        expect(info.summary.lessons).toBe(1);
        expect(info.summary.videos).toBe(1);
        expect(info.dependencies).toHaveLength(2);

        const lessonDependency = info.dependencies.find(
          (d) => d.type === 'lesson',
        );
        expect(lessonDependency).toBeDefined();
        expect(lessonDependency?.name).toBe('Lesson 1');
        expect(lessonDependency?.relatedEntities?.videos).toBe(5);
        expect(lessonDependency?.relatedEntities?.documents).toBe(2);
        expect(lessonDependency?.relatedEntities?.flashcards).toBe(3);
        expect(lessonDependency?.relatedEntities?.quizzes).toBe(1);

        const videoDependency = info.dependencies.find(
          (d) => d.type === 'video',
        );
        expect(videoDependency).toBeDefined();
        expect(videoDependency?.name).toBe('Module Intro');
      }
    });

    it('handles multiple modules from same course', async () => {
      const courseId = new UniqueEntityID().toString();
      const module1 = createValidModule(undefined, 1);
      const module2 = createValidModule(undefined, 2);
      const module3 = createValidModule(undefined, 3);

      await repo.create(courseId, module1);
      await repo.create(courseId, module2);
      await repo.create(courseId, module3);

      // Deletar apenas o módulo 2
      const request = validDeleteRequest(module2.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(2);

      // Verificar que os outros módulos ainda existem
      const remainingModules = await repo.findByCourseId(courseId);
      expect(remainingModules.isRight()).toBe(true);
      if (remainingModules.isRight()) {
        expect(remainingModules.value).toHaveLength(2);
        expect(remainingModules.value.map((m) => m.order)).toEqual([1, 3]);
      }
    });
  });
});
