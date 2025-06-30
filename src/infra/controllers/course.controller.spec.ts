// src/infra/course-catalog/controllers/course.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { CourseHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/course-has-dependencies-error';
import { CourseController } from './course.controller';
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto';
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case';
import { GetCourseUseCase } from '@/domain/course-catalog/application/use-cases/get-course.use-case';

class MockCreateUseCase {
  execute = vi.fn();
}
class MockListUseCase {
  execute = vi.fn();
}
class MockGetUseCase {
  execute = vi.fn();
}
class MockDeleteUseCase {
  execute = vi.fn();
}

describe('CourseController', () => {
  let controller: CourseController;
  let createUseCase: MockCreateUseCase;
  let listUseCase: MockListUseCase;
  let getUseCase: MockGetUseCase;
  let deleteUseCase: MockDeleteUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateUseCase();
    listUseCase = new MockListUseCase();
    getUseCase = new MockGetUseCase();
    deleteUseCase = new MockDeleteUseCase();
    controller = new CourseController(
      createUseCase as any,
      listUseCase as any,
      getUseCase as any,
      deleteUseCase as any,
    );
  });

  describe('getById()', () => {
    it('returns course payload on success', async () => {
      const payload = {
        course: {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          slug: 'curso-exemplo',
          title: 'Curso Exemplo',
          description: 'Descrição Exemplo',
        },
      };
      getUseCase.execute.mockResolvedValueOnce(right(payload));

      const response = await controller.getById(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );
      expect(response).toEqual(payload.course);
      expect(getUseCase.execute).toHaveBeenCalledWith({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const details = [{ path: ['id'], message: 'ID must be a valid UUID' }];
      getUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Val failed', details)),
      );

      await expect(controller.getById('invalid-id')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException on CourseNotFoundError', async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new CourseNotFoundError()));

      await expect(
        controller.getById('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      getUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('DB down')),
      );

      await expect(
        controller.getById('cccccccc-cccc-cccc-cccc-cccccccccccc'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new Error('unexpected')));

      await expect(
        controller.getById('dddddddd-dddd-dddd-dddd-dddddddddddd'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('delete()', () => {
    const validCourseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    it('returns success response when course is deleted successfully', async () => {
      const successPayload = {
        message: 'Course deleted successfully',
        deletedAt: new Date('2024-01-30T10:30:00.000Z'),
      };
      deleteUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.delete(validCourseId);

      expect(response).toEqual({
        success: true,
        message: successPayload.message,
        deletedAt: successPayload.deletedAt,
      });
      expect(deleteUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
      });
    });

    it('throws BadRequestException with details on InvalidInputError', async () => {
      const details = [
        {
          path: ['id'],
          message: 'Course ID must be a valid UUID',
          code: 'invalid_string',
        },
      ];
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      try {
        await controller.delete('invalid-uuid');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid course ID format',
          details,
        });
      }
    });

    it('throws NotFoundException on CourseNotFoundError', async () => {
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new CourseNotFoundError()),
      );

      try {
        await controller.delete('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getResponse()).toEqual({
          error: 'COURSE_NOT_FOUND',
          message: 'Course not found',
        });
      }
    });

    it('throws BadRequestException with dependency info on CourseHasDependenciesError', async () => {
      const dependencyInfo = {
        canDelete: false,
        totalDependencies: 2,
        summary: {
          modules: 1,
          tracks: 1,
          lessons: 5,
          videos: 15,
        },
        dependencies: [
          {
            type: 'module',
            id: 'module-1',
            name: 'Advanced Programming',
            description: 'Advanced programming concepts',
            actionRequired: 'Delete module "Advanced Programming" first',
            relatedEntities: {
              lessons: 5,
              videos: 15,
            },
          },
          {
            type: 'track',
            id: 'track-1',
            name: 'Full-Stack Development',
            description: 'Complete development track',
            actionRequired:
              'Remove course from track "Full-Stack Development" first',
          },
        ],
      };

      const error = new CourseHasDependenciesError([
        'Advanced Programming',
        'Full-Stack Development',
      ]);
      (error as any).dependencyInfo = dependencyInfo;
      deleteUseCase.execute.mockResolvedValueOnce(left(error));

      try {
        await controller.delete(validCourseId);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(BadRequestException);
        expect(thrownError.getResponse()).toEqual({
          error: 'COURSE_HAS_DEPENDENCIES',
          message: error.message,
          canDelete: false,
          dependencies: dependencyInfo.dependencies,
          summary: dependencyInfo.summary,
          totalDependencies: dependencyInfo.totalDependencies,
          actionRequired:
            'Please resolve the dependencies before deleting this course',
        });
      }
    });

    it('throws BadRequestException with empty dependency info when dependencyInfo is not available', async () => {
      const error = new CourseHasDependenciesError(['Some Module']);
      // Sem dependencyInfo
      deleteUseCase.execute.mockResolvedValueOnce(left(error));

      try {
        await controller.delete(validCourseId);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(BadRequestException);
        expect(thrownError.getResponse()).toEqual({
          error: 'COURSE_HAS_DEPENDENCIES',
          message: error.message,
          canDelete: false,
          dependencies: [],
          summary: {},
          totalDependencies: 0,
          actionRequired:
            'Please resolve the dependencies before deleting this course',
        });
      }
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      try {
        await controller.delete(validCourseId);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      deleteUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error occurred')),
      );

      try {
        await controller.delete(validCourseId);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }
    });

    it('calls deleteUseCase.execute with correct parameters', async () => {
      const successPayload = {
        message: 'Course deleted successfully',
        deletedAt: new Date(),
      };
      deleteUseCase.execute.mockResolvedValueOnce(right(successPayload));

      await controller.delete(validCourseId);

      expect(deleteUseCase.execute).toHaveBeenCalledTimes(1);
      expect(deleteUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
      });
    });

    it('preserves deletedAt timestamp in success response', async () => {
      const deletedAt = new Date('2024-01-30T15:45:30.123Z');
      const successPayload = {
        message: 'Course deleted successfully',
        deletedAt,
      };
      deleteUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.delete(validCourseId);

      expect(response.deletedAt).toBe(deletedAt);
      expect(response.deletedAt).toBeInstanceOf(Date);
    });

    it('handles multiple dependency types correctly', async () => {
      const dependencyInfo = {
        canDelete: false,
        totalDependencies: 3,
        summary: {
          modules: 2,
          tracks: 1,
          lessons: 10,
          videos: 25,
        },
        dependencies: [
          {
            type: 'module',
            id: 'module-1',
            name: 'Basic JavaScript',
            actionRequired: 'Delete module "Basic JavaScript" first',
          },
          {
            type: 'module',
            id: 'module-2',
            name: 'Advanced React',
            actionRequired: 'Delete module "Advanced React" first',
          },
          {
            type: 'track',
            id: 'track-1',
            name: 'Frontend Development',
            actionRequired:
              'Remove course from track "Frontend Development" first',
          },
        ],
      };

      const error = new CourseHasDependenciesError([
        'Basic JavaScript',
        'Advanced React',
        'Frontend Development',
      ]);
      (error as any).dependencyInfo = dependencyInfo;
      deleteUseCase.execute.mockResolvedValueOnce(left(error));

      try {
        await controller.delete(validCourseId);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(BadRequestException);
        const response = thrownError.getResponse();
        expect(response.dependencies).toHaveLength(3);
        expect(response.summary.modules).toBe(2);
        expect(response.summary.tracks).toBe(1);
        expect(response.totalDependencies).toBe(3);
      }
    });
  });
});
