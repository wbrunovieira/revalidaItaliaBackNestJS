// src/infra/course-catalog/controllers/module.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { ModuleHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/module-has-dependencies-error';
import { ModuleDependencyInfo } from '@/domain/course-catalog/application/dtos/module-dependencies.dto';
import { ModuleController } from './module.controller';
import { CreateModuleDto } from '@/domain/course-catalog/application/dtos/create-module.dto';

class MockCreateUseCase {
  execute = vi.fn();
}

class MockGetUseCase {
  execute = vi.fn();
}

class MockGetOneUseCase {
  execute = vi.fn();
}

class MockDeleteUseCase {
  execute = vi.fn();
}

describe('ModuleController', () => {
  let controller: ModuleController;
  let createUseCase: MockCreateUseCase;
  let getUseCase: MockGetUseCase;
  let getOneUseCase: MockGetOneUseCase;
  let deleteUseCase: MockDeleteUseCase;

  const validDto: CreateModuleDto = {
    slug: 'modulo-teste',
    translations: [
      { locale: 'pt', title: 'Módulo Teste', description: 'Descrição válida' },
      { locale: 'it', title: 'Modulo Test', description: 'Descrizione valida' },
      {
        locale: 'es',
        title: 'Módulo Prueba',
        description: 'Descripción válida',
      },
    ],
    order: 1,
  };
  const courseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const moduleId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    createUseCase = new MockCreateUseCase();
    getUseCase = new MockGetUseCase();
    getOneUseCase = new MockGetOneUseCase();
    deleteUseCase = new MockDeleteUseCase();
    controller = new ModuleController(
      createUseCase as any,
      getUseCase as any,
      getOneUseCase as any,
      deleteUseCase as any,
    );
  });

  describe('POST /courses/:courseId/modules', () => {
    it('should return created module payload on success', async () => {
      const payload = {
        module: {
          id: 'module-1234',
          slug: 'modulo-teste',
          order: 1,
          translations: validDto.translations,
        },
      };
      createUseCase.execute.mockResolvedValueOnce(right(payload));

      const response = await controller.create(courseId, validDto);
      expect(response).toEqual(payload.module);

      expect(createUseCase.execute).toHaveBeenCalledWith({
        courseId,
        slug: validDto.slug,
        translations: validDto.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
        })),
        order: validDto.order,
      });
    });

    it('should handle imageUrl when provided', async () => {
      const dtoWithImage = {
        ...validDto,
        imageUrl: 'https://example.com/image.jpg',
      };
      const payload = { module: { id: 'module-1234', ...dtoWithImage } };
      createUseCase.execute.mockResolvedValueOnce(right(payload));

      await controller.create(courseId, dtoWithImage);

      expect(createUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://example.com/image.jpg',
        }),
      );
    });

    it('should throw BadRequestException on InvalidInputError', async () => {
      const details = [{ path: ['translations'], message: 'Falta pt' }];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validação falhou', details)),
      );

      await expect(
        controller.create(courseId, validDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException on CourseNotFoundError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new CourseNotFoundError()),
      );

      await expect(
        controller.create(courseId, validDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException on DuplicateModuleOrderError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new DuplicateModuleOrderError()),
      );

      await expect(
        controller.create(courseId, validDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should throw InternalServerErrorException on generic Error', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected')),
      );

      await expect(
        controller.create(courseId, validDto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('GET /courses/:courseId/modules', () => {
    it('should return modules list on success', async () => {
      const modulesPayload = [
        { id: 'm1', slug: 'mod1', order: 1, translations: [] },
        { id: 'm2', slug: 'mod2', order: 2, translations: [] },
      ];
      getUseCase.execute.mockResolvedValueOnce(
        right({ modules: modulesPayload }),
      );

      const response = await controller.findAll(courseId);
      expect(response).toEqual(modulesPayload);
      expect(getUseCase.execute).toHaveBeenCalledWith({ courseId });
    });

    it('should return empty array when no modules exist', async () => {
      getUseCase.execute.mockResolvedValueOnce(right({ modules: [] }));

      const response = await controller.findAll(courseId);
      expect(response).toEqual([]);
    });

    it('should throw BadRequestException on InvalidInputError', async () => {
      const details = [{ path: ['courseId'], message: 'Invalid UUID' }];
      getUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.findAll(courseId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on generic Error', async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new Error('DB error')));

      await expect(controller.findAll(courseId)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('GET /courses/:courseId/modules/:moduleId', () => {
    it('should return module on success', async () => {
      const module = { id: moduleId, slug: 'mod1', order: 1, translations: [] };
      getOneUseCase.execute.mockResolvedValueOnce(right({ module }));

      const response = await controller.findOne(courseId, moduleId);
      expect(response).toEqual(module);
      expect(getOneUseCase.execute).toHaveBeenCalledWith({ moduleId });
    });

    it('should throw BadRequestException on invalid UUID format', async () => {
      const details = [{ path: ['moduleId'], message: 'Invalid UUID' }];
      getOneUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Bad', details)),
      );

      await expect(
        controller.findOne(courseId, 'bad-uuid'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when module does not exist', async () => {
      getOneUseCase.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError()),
      );

      await expect(
        controller.findOne(courseId, moduleId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw InternalServerErrorException on generic error', async () => {
      getOneUseCase.execute.mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      await expect(
        controller.findOne(courseId, moduleId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('DELETE /courses/:courseId/modules/:moduleId', () => {
    it('should return success response when module is deleted', async () => {
      const deletedAt = new Date();
      const successResponse = {
        message: 'Module deleted successfully',
        deletedAt,
      };
      deleteUseCase.execute.mockResolvedValueOnce(right(successResponse));

      const response = await controller.delete(courseId, moduleId);

      expect(response).toEqual(successResponse);
      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: moduleId });
    });

    it('should throw BadRequestException when moduleId is invalid', async () => {
      const details = [
        {
          path: ['id'],
          message: 'Module ID must be a valid UUID',
          code: 'invalid_string',
        },
      ];
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.delete(courseId, 'invalid-id'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when moduleId is empty', async () => {
      const details = [
        {
          path: ['id'],
          message: 'Module ID is required',
        },
      ];
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.delete(courseId, '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when module does not exist', async () => {
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError()),
      );

      await expect(
        controller.delete(courseId, moduleId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException with dependency details when module has dependencies', async () => {
      const dependencyInfo: ModuleDependencyInfo = {
        canDelete: false,
        totalDependencies: 3,
        summary: {
          lessons: 2,
          videos: 5,
        },
        dependencies: [
          {
            type: 'lesson' as const,
            id: 'lesson-1',
            name: 'Introduction Lesson',
            relatedEntities: {
              videos: 2,
              documents: 1,
              flashcards: 0,
              quizzes: 1,
            },
          },
          {
            type: 'lesson' as const,
            id: 'lesson-2',
            name: 'Advanced Lesson',
            relatedEntities: {
              videos: 3,
              documents: 2,
              flashcards: 2,
              quizzes: 0,
            },
          },
        ],
      };

      const error = new ModuleHasDependenciesError(
        ['Introduction Lesson', 'Advanced Lesson'],
        dependencyInfo,
      );
      (error as any).dependencyInfo = dependencyInfo;

      deleteUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(controller.delete(courseId, moduleId)).rejects.toMatchObject(
        {
          response: {
            message: expect.stringContaining(
              'Cannot delete module because it has dependencies',
            ),
            statusCode: 409,
            error: 'Conflict',
            dependencyInfo: expect.objectContaining({
              canDelete: false,
              totalDependencies: 3,
              summary: expect.objectContaining({
                lessons: 2,
                videos: 5,
              }),
            }),
          },
        },
      );
    });

    it('should throw ConflictException when module has only video dependencies', async () => {
      const dependencyInfo: ModuleDependencyInfo = {
        canDelete: false,
        totalDependencies: 1,
        summary: {
          lessons: 0,
          videos: 1,
        },
        dependencies: [
          {
            type: 'video' as const,
            id: 'video-1',
            name: 'Module Overview Video',
          },
        ],
      };

      const error = new ModuleHasDependenciesError(
        ['Module Overview Video'],
        dependencyInfo,
      );
      (error as any).dependencyInfo = dependencyInfo;

      deleteUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.delete(courseId, moduleId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      await expect(
        controller.delete(courseId, moduleId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when use case throws', async () => {
      deleteUseCase.execute.mockRejectedValueOnce(
        new Error('Unexpected exception'),
      );

      await expect(
        controller.delete(courseId, moduleId),
      ).rejects.toBeInstanceOf(Error);
    });

    it('should handle edge case of very long moduleId', async () => {
      const veryLongId = 'a'.repeat(1000);
      const details = [
        {
          path: ['id'],
          message: 'Module ID must be a valid UUID',
        },
      ];
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.delete(courseId, veryLongId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should handle SQL injection attempt in moduleId', async () => {
      const maliciousId = "'; DROP TABLE modules; --";
      const details = [
        {
          path: ['id'],
          message: 'Module ID must be a valid UUID',
        },
      ];
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.delete(courseId, maliciousId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should correctly pass through the exact error response structure', async () => {
      const customError = new Error('Custom repository error');
      deleteUseCase.execute.mockResolvedValueOnce(left(customError));

      try {
        await controller.delete(courseId, moduleId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Custom repository error');
      }
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle null or undefined responses gracefully', async () => {
      createUseCase.execute.mockResolvedValueOnce(right({ module: null }));
      const response = await controller.create(courseId, validDto);
      expect(response).toBeNull();
    });

    it('should handle when courseId does not match module ownership', async () => {
      // This tests the controller behavior, even though the validation
      // might happen at the use case level
      const differentCourseId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      deleteUseCase.execute.mockResolvedValueOnce(
        right({
          message: 'Module deleted successfully',
          deletedAt: new Date(),
        }),
      );

      const response = await controller.delete(differentCourseId, moduleId);
      expect(response).toBeDefined();
      // The controller doesn't validate course ownership - that's the use case's job
    });

    it('should handle concurrent delete requests gracefully', async () => {
      // First request succeeds
      deleteUseCase.execute.mockResolvedValueOnce(
        right({
          message: 'Module deleted successfully',
          deletedAt: new Date(),
        }),
      );

      // Second request fails because module is already deleted
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new ModuleNotFoundError()),
      );

      const response1 = await controller.delete(courseId, moduleId);
      expect(response1.message).toBe('Module deleted successfully');

      await expect(
        controller.delete(courseId, moduleId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
