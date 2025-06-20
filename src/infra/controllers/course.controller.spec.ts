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

describe('CourseController', () => {
  let controller: CourseController;
  let createUseCase: MockCreateUseCase;
  let listUseCase: MockListUseCase;
  let getUseCase: MockGetUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateUseCase();
    listUseCase = new MockListUseCase();
    getUseCase = new MockGetUseCase();
    controller = new CourseController(
      createUseCase as any,
      listUseCase as any,
      getUseCase as any,
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
});
