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
import { CourseNotModifiedError } from '@/domain/course-catalog/application/use-cases/errors/course-not-modified-error';
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
class MockUpdateUseCase {
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
  let updateUseCase: MockUpdateUseCase;
  let deleteUseCase: MockDeleteUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    createUseCase = new MockCreateUseCase();
    listUseCase = new MockListUseCase();
    getUseCase = new MockGetUseCase();
    updateUseCase = new MockUpdateUseCase();
    deleteUseCase = new MockDeleteUseCase();

    controller = new CourseController(
      createUseCase as any,
      listUseCase as any,
      getUseCase as any,
      deleteUseCase as any,
      updateUseCase as any,
    );
  });

  describe('create()', () => {
    const validCreateDto: CreateCourseDto = {
      slug: 'novo-curso',
      imageUrl: '/images/curso.jpg',
      translations: [
        {
          locale: 'pt',
          title: 'Novo Curso',
          description: 'Descrição do novo curso',
        },
        {
          locale: 'it',
          title: 'Nuovo Corso',
          description: 'Descrizione del nuovo corso',
        },
      ],
    };

    it('returns created course on success', async () => {
      const createdCourse = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        slug: 'novo-curso',
        imageUrl: '/images/curso.jpg',
        title: 'Novo Curso',
        description: 'Descrição do novo curso',
        createdAt: new Date('2024-01-30T10:00:00.000Z'),
        updatedAt: new Date('2024-01-30T10:00:00.000Z'),
      };
      createUseCase.execute.mockResolvedValueOnce(
        right({ course: createdCourse }),
      );

      const response = await controller.create(validCreateDto);

      expect(response).toEqual(createdCourse);
      expect(createUseCase.execute).toHaveBeenCalledWith({
        slug: validCreateDto.slug,
        imageUrl: validCreateDto.imageUrl,
        translations: validCreateDto.translations,
      });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const details = [
        {
          path: ['slug'],
          message: 'Slug must be at least 3 characters long',
          code: 'too_small',
        },
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(
        controller.create({ ...validCreateDto, slug: 'ab' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException on DuplicateCourseError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new DuplicateCourseError()),
      );

      await expect(controller.create(validCreateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      await expect(controller.create(validCreateDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error')),
      );

      await expect(controller.create(validCreateDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('handles empty imageUrl', async () => {
      const dtoWithoutImage = {
        ...validCreateDto,
        imageUrl: '',
      };
      const createdCourse = {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        slug: 'novo-curso',
        imageUrl: '',
        title: 'Novo Curso',
        description: 'Descrição do novo curso',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      createUseCase.execute.mockResolvedValueOnce(
        right({ course: createdCourse }),
      );

      const response = await controller.create(dtoWithoutImage);

      expect(response.imageUrl).toBe('');
      expect(createUseCase.execute).toHaveBeenCalledWith({
        slug: dtoWithoutImage.slug,
        imageUrl: '',
        translations: dtoWithoutImage.translations,
      });
    });

    it('validates translation locales', async () => {
      const details = [
        {
          path: ['translations', 0, 'locale'],
          message: 'Invalid locale',
          code: 'invalid_enum_value',
        },
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      const invalidDto = {
        ...validCreateDto,
        translations: [
          {
            locale: 'invalid' as any,
            title: 'Title',
            description: 'Description',
          },
        ],
      };

      await expect(controller.create(invalidDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('handles multiple validation errors', async () => {
      const details = [
        {
          path: ['slug'],
          message: 'Slug is required',
          code: 'invalid_type',
        },
        {
          path: ['translations'],
          message: 'At least one translation is required',
          code: 'too_small',
        },
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Multiple validation errors', details)),
      );

      const invalidDto = {
        slug: undefined as any,
        imageUrl: '/image.jpg',
        translations: [],
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        // BadRequestException wraps the details in a standard error response
        expect(response).toHaveProperty('statusCode', 400);
        expect(response).toHaveProperty('error', 'Bad Request');
        expect(response).toHaveProperty('message');
        expect(response.message).toEqual(details);
      }
    });
  });

  describe('list()', () => {
    it('returns array of courses on success', async () => {
      const courses = [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          slug: 'curso-1',
          imageUrl: '/images/curso1.jpg',
          title: 'Curso 1',
          description: 'Descrição do curso 1',
          createdAt: new Date('2024-01-01T10:00:00.000Z'),
          updatedAt: new Date('2024-01-01T10:00:00.000Z'),
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          slug: 'curso-2',
          imageUrl: '/images/curso2.jpg',
          title: 'Curso 2',
          description: 'Descrição do curso 2',
          createdAt: new Date('2024-01-02T10:00:00.000Z'),
          updatedAt: new Date('2024-01-02T10:00:00.000Z'),
        },
      ];
      listUseCase.execute.mockResolvedValueOnce(right({ courses }));

      const response = await controller.list();

      expect(response).toEqual(courses);
      expect(response).toHaveLength(2);
      expect(listUseCase.execute).toHaveBeenCalledWith();
    });

    it('returns empty array when no courses exist', async () => {
      listUseCase.execute.mockResolvedValueOnce(right({ courses: [] }));

      const response = await controller.list();

      expect(response).toEqual([]);
      expect(response).toHaveLength(0);
      expect(listUseCase.execute).toHaveBeenCalledWith();
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      listUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database query failed')),
      );

      await expect(controller.list()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      listUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error occurred')),
      );

      await expect(controller.list()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('calls listUseCase.execute exactly once', async () => {
      listUseCase.execute.mockResolvedValueOnce(right({ courses: [] }));

      await controller.list();

      expect(listUseCase.execute).toHaveBeenCalledTimes(1);
      expect(listUseCase.execute).toHaveBeenCalledWith();
    });

    it('preserves course properties in response', async () => {
      const courses = [
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          slug: 'curso-completo',
          imageUrl: '/images/completo.jpg',
          title: 'Curso Completo',
          description: 'Descrição completa do curso com todas as propriedades',
          createdAt: new Date('2024-01-15T14:30:00.000Z'),
          updatedAt: new Date('2024-01-20T16:45:00.000Z'),
          isActive: true,
          enrollmentCount: 150,
          metadata: { level: 'intermediate', duration: '6 months' },
        },
      ];
      listUseCase.execute.mockResolvedValueOnce(right({ courses }));

      const response = await controller.list();

      expect(response[0]).toMatchObject({
        id: courses[0].id,
        slug: courses[0].slug,
        imageUrl: courses[0].imageUrl,
        title: courses[0].title,
        description: courses[0].description,
        createdAt: courses[0].createdAt,
        updatedAt: courses[0].updatedAt,
        isActive: courses[0].isActive,
        enrollmentCount: courses[0].enrollmentCount,
        metadata: courses[0].metadata,
      });
    });
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

  describe('update()', () => {
    const validCourseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const validUpdateDto = {
      slug: 'curso-atualizado',
      imageUrl: '/images/nova-imagem.jpg',
      translations: [
        {
          locale: 'pt' as const,
          title: 'Curso Atualizado',
          description: 'Descrição atualizada do curso',
        },
        {
          locale: 'it' as const,
          title: 'Corso Aggiornato',
          description: 'Descrizione aggiornata del corso',
        },
      ],
    };

    it('returns success response when course is updated successfully', async () => {
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-atualizado',
          imageUrl: '/images/nova-imagem.jpg',
          title: 'Curso Atualizado',
          description: 'Descrição atualizada do curso',
          updatedAt: new Date('2024-01-30T10:30:00.000Z'),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(validCourseId, validUpdateDto);

      expect(response).toEqual({
        success: true,
        course: successPayload.course,
      });
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: validUpdateDto.slug,
        imageUrl: validUpdateDto.imageUrl,
        translations: validUpdateDto.translations,
      });
    });

    it('handles partial update with only slug', async () => {
      const partialDto = { slug: 'novo-slug' };
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'novo-slug',
          imageUrl: '/images/original.jpg',
          title: 'Título Original',
          description: 'Descrição Original',
          updatedAt: new Date('2024-01-30T10:30:00.000Z'),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(validCourseId, partialDto);

      expect(response.success).toBe(true);
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: partialDto.slug,
        imageUrl: undefined,
        translations: undefined,
      });
    });

    it('throws BadRequestException with details on InvalidInputError', async () => {
      const details = [
        {
          path: ['slug'],
          message: 'Slug must be at least 3 characters long',
          code: 'too_small',
        },
      ];
      updateUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      try {
        await controller.update(validCourseId, { slug: 'ab' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details,
        });
      }
    });

    it('throws NotFoundException on CourseNotFoundError', async () => {
      updateUseCase.execute.mockResolvedValueOnce(
        left(new CourseNotFoundError()),
      );

      try {
        await controller.update(
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          validUpdateDto,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getResponse()).toEqual({
          error: 'COURSE_NOT_FOUND',
          message: 'Course not found',
        });
      }
    });

    it('throws ConflictException on DuplicateCourseError', async () => {
      updateUseCase.execute.mockResolvedValueOnce(
        left(new DuplicateCourseError()),
      );

      try {
        await controller.update(validCourseId, { slug: 'slug-existente' });
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getResponse()).toEqual({
          error: 'DUPLICATE_COURSE',
          message: 'Course with this title already exists',
        });
      }
    });

    it('throws BadRequestException on CourseNotModifiedError', async () => {
      updateUseCase.execute.mockResolvedValueOnce(
        left(new CourseNotModifiedError()),
      );

      try {
        await controller.update(validCourseId, validUpdateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'COURSE_NOT_MODIFIED',
          message: 'No changes detected in course data',
        });
      }
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      updateUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      try {
        await controller.update(validCourseId, validUpdateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      updateUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error occurred')),
      );

      try {
        await controller.update(validCourseId, validUpdateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }
    });

    it('calls updateUseCase.execute with correct parameters', async () => {
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-atualizado',
          title: 'Curso Atualizado',
          description: 'Descrição atualizada',
          updatedAt: new Date(),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      await controller.update(validCourseId, validUpdateDto);

      expect(updateUseCase.execute).toHaveBeenCalledTimes(1);
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: validUpdateDto.slug,
        imageUrl: validUpdateDto.imageUrl,
        translations: validUpdateDto.translations,
      });
    });

    it('preserves updatedAt timestamp in success response', async () => {
      const updatedAt = new Date('2024-01-30T15:45:30.123Z');
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-atualizado',
          title: 'Curso Atualizado',
          description: 'Descrição atualizada',
          updatedAt,
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(validCourseId, validUpdateDto);

      expect(response.course.updatedAt).toBe(updatedAt);
      expect(response.course.updatedAt).toBeInstanceOf(Date);
    });

    it('handles update with empty imageUrl (removal)', async () => {
      const dtoWithEmptyImage = {
        slug: 'curso-sem-imagem',
        imageUrl: '',
        translations: validUpdateDto.translations,
      };
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-sem-imagem',
          imageUrl: '',
          title: 'Curso Atualizado',
          description: 'Descrição atualizada',
          updatedAt: new Date(),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(
        validCourseId,
        dtoWithEmptyImage,
      );

      expect(response.success).toBe(true);
      expect(response.course.imageUrl).toBe('');
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: dtoWithEmptyImage.slug,
        imageUrl: '',
        translations: dtoWithEmptyImage.translations,
      });
    });

    it('handles update with undefined imageUrl', async () => {
      const dtoWithUndefinedImage = {
        slug: 'curso-teste',
        translations: validUpdateDto.translations,
        // imageUrl is undefined (not provided)
      };
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-teste',
          imageUrl: undefined,
          title: 'Curso Atualizado',
          description: 'Descrição atualizada',
          updatedAt: new Date(),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(
        validCourseId,
        dtoWithUndefinedImage,
      );

      expect(response.success).toBe(true);
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: dtoWithUndefinedImage.slug,
        imageUrl: undefined,
        translations: dtoWithUndefinedImage.translations,
      });
    });

    it('handles update with only translations', async () => {
      const translationsOnlyDto = {
        translations: [
          {
            locale: 'pt' as const,
            title: 'Novo Título',
            description: 'Nova Descrição',
          },
        ],
      };
      const successPayload = {
        course: {
          id: validCourseId,
          slug: 'curso-original',
          imageUrl: '/images/original.jpg',
          title: 'Novo Título',
          description: 'Nova Descrição',
          updatedAt: new Date(),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(successPayload));

      const response = await controller.update(
        validCourseId,
        translationsOnlyDto,
      );

      expect(response.success).toBe(true);
      expect(response.course.title).toBe('Novo Título');
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validCourseId,
        slug: undefined,
        imageUrl: undefined,
        translations: translationsOnlyDto.translations,
      });
    });

    it('handles validation error with multiple field errors', async () => {
      const details = [
        {
          path: ['slug'],
          message: 'Slug must be at least 3 characters long',
          code: 'too_small',
        },
        {
          path: ['translations', 0, 'title'],
          message: 'Course title must be at least 3 characters long',
          code: 'too_small',
        },
      ];
      updateUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      try {
        await controller.update(validCourseId, {
          slug: 'ab',
          translations: [
            { locale: 'pt' as const, title: 'A', description: 'Valid desc' },
          ],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.details).toHaveLength(2);
        expect(response.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['slug'] }),
            expect.objectContaining({ path: ['translations', 0, 'title'] }),
          ]),
        );
      }
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
