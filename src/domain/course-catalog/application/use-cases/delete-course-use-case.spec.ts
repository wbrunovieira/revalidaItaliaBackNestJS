// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/delete-course.use-case.spec.ts (atualizado)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteCourseUseCase } from '@/domain/course-catalog/application/use-cases/delete-course.use-case';
import { InMemoryCourseRepository } from '@/test/repositories/in-memory-course-repository';
import { DeleteCourseRequest } from '@/domain/course-catalog/application/dtos/delete-course-request.dto';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { CourseHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/course-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import { CourseDependencyInfo } from '@/domain/course-catalog/application/dtos/course-dependencies.dto';

let repo: InMemoryCourseRepository;
let sut: DeleteCourseUseCase;

describe('DeleteCourseUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new DeleteCourseUseCase(repo);
  });

  function createValidCourse(id?: string): Course {
    const courseId = id || new UniqueEntityID().toString();

    return Course.create(
      {
        slug: 'curso-teste',
        translations: [
          {
            locale: 'pt',
            title: 'Curso de Teste',
            description: 'Descrição do curso de teste',
          },
        ],
      },
      new UniqueEntityID(courseId),
    );
  }

  function createCourseWithDependencies(
    id?: string,
    dependencies: { modules?: any[]; tracks?: any[] } = {},
  ): Course {
    const course = createValidCourse(id);

    // Simular dependências para testes
    if (dependencies.modules) {
      (course as any).modules = dependencies.modules;
    }
    if (dependencies.tracks) {
      (course as any).tracks = dependencies.tracks;
    }

    return course;
  }

  function validDeleteRequest(id?: string): DeleteCourseRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a course successfully when it exists and has no dependencies', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Course deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('returns success message with current timestamp', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(course.id.toString());
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
    it('rejects empty course ID', async () => {
      const request: any = { id: '' };
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

    it('rejects missing course ID', async () => {
      const request: any = {};
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
      const request: any = { id: 'invalid-uuid' };
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

    it('rejects non-string course ID', async () => {
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

    it('rejects null course ID', async () => {
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

  describe('Course not found errors', () => {
    it('returns CourseNotFoundError when course does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseNotFoundError;
        expect(error).toBeInstanceOf(CourseNotFoundError);
        expect(error.message).toBe('Course not found');
      }
    });

    it('handles repository error when finding course', async () => {
      const courseId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validDeleteRequest(courseId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const courseId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Course lookup failed')),
      );

      const request = validDeleteRequest(courseId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseNotFoundError;
        expect(error).toBeInstanceOf(CourseNotFoundError);
        expect(error.message).toBe('Course not found');
      }
    });
  });

  describe('Course dependencies errors', () => {
    it('returns CourseHasDependenciesError when course has modules', async () => {
      const course = createCourseWithDependencies(undefined, {
        modules: [
          { slug: 'module-1', lessons: [], videos: [] },
          { slug: 'module-2', lessons: [], videos: [] },
        ],
      });
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseHasDependenciesError;
        expect(error).toBeInstanceOf(CourseHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete course because it has dependencies',
        );
        expect(error.message).toContain('module-1');
        expect(error.message).toContain('module-2');
      }
    });

    it('returns CourseHasDependenciesError when course has track associations', async () => {
      const course = createCourseWithDependencies(undefined, {
        tracks: [
          { name: 'JavaScript Fundamentals', description: 'Basic JS track' },
        ],
      });
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseHasDependenciesError;
        expect(error).toBeInstanceOf(CourseHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete course because it has dependencies',
        );
        expect(error.message).toContain('JavaScript Fundamentals');
      }
    });

    it('returns CourseHasDependenciesError when course has both modules and tracks', async () => {
      const course = createCourseWithDependencies(undefined, {
        modules: [{ slug: 'advanced-module', lessons: [], videos: [] }],
        tracks: [
          {
            name: 'Full-Stack Track',
            description: 'Complete development track',
          },
        ],
      });
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseHasDependenciesError;
        expect(error).toBeInstanceOf(CourseHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete course because it has dependencies',
        );
        expect(error.message).toContain('advanced-module');
        expect(error.message).toContain('Full-Stack Track');
      }
    });

    it('includes dependency info in error for frontend usage', async () => {
      const course = createCourseWithDependencies(undefined, {
        modules: [{ slug: 'test-module', lessons: [1, 2], videos: [1, 2, 3] }],
      });
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseHasDependenciesError;
        expect(error).toBeInstanceOf(CourseHasDependenciesError);

        // Verificar se a informação extra está disponível
        const errorWithInfo = error as any;
        expect(errorWithInfo.dependencyInfo).toBeDefined();
        expect(errorWithInfo.dependencyInfo.canDelete).toBe(false);
        expect(errorWithInfo.dependencyInfo.totalDependencies).toBeGreaterThan(
          0,
        );
        expect(errorWithInfo.dependencyInfo.summary.modules).toBe(1);
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'checkCourseDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = validDeleteRequest(course.id.toString());
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
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during course lookup', async () => {
      const courseId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(courseId);
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
    it('handles course with no dependencies', async () => {
      const course = createValidCourse();
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Course deleted successfully');
      }
    });

    it('handles course with empty dependency arrays', async () => {
      const course = createCourseWithDependencies(undefined, {
        modules: [],
        tracks: [],
      });
      await repo.create(course);

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Course deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      // UUID that passes regex but might fail in database
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as CourseNotFoundError;
        expect(error).toBeInstanceOf(CourseNotFoundError);
        expect(error.message).toBe('Course not found');
      }
    });

    it('handles exception during dependencies check', async () => {
      const course = createValidCourse();
      await repo.create(course);

      vi.spyOn(repo, 'checkCourseDependencies').mockImplementationOnce(() => {
        throw new Error('Unexpected dependencies check error');
      });

      const request = validDeleteRequest(course.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected dependencies check error');
      }
    });

    it('verifies dependency information structure', async () => {
      const course = createCourseWithDependencies(undefined, {
        modules: [
          { slug: 'module-1', lessons: [1, 2], videos: [1, 2, 3, 4, 5] },
        ],
        tracks: [{ name: 'Track 1', description: 'First track' }],
      });
      await repo.create(course);

      // Testar o método checkCourseDependencies diretamente
      const dependenciesResult = await repo.checkCourseDependencies(
        course.id.toString(),
      );

      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(2);
        expect(info.summary.modules).toBe(1);
        expect(info.summary.tracks).toBe(1);
        expect(info.dependencies).toHaveLength(2);

        const moduleDependendy = info.dependencies.find(
          (d) => d.type === 'module',
        );
        expect(moduleDependendy).toBeDefined();
        expect(moduleDependendy?.name).toBe('module-1');
        expect(moduleDependendy?.relatedEntities?.lessons).toBe(2);
        expect(moduleDependendy?.relatedEntities?.videos).toBe(5);

        const trackDependency = info.dependencies.find(
          (d) => d.type === 'track',
        );
        expect(trackDependency).toBeDefined();
        expect(trackDependency?.name).toBe('Track 1');
      }
    });
  });
});
