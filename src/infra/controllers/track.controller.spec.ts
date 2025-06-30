// src/infra/course-catalog/controllers/track.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';
import { TrackNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/track-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { GetTrackUseCase } from '@/domain/course-catalog/application/use-cases/get-track.use-case';
import { ListTracksUseCase } from '@/domain/course-catalog/application/use-cases/list-tracks.use-case';
import { DeleteTrackUseCase } from '@/domain/course-catalog/application/use-cases/delete-track.use-case';
import { UpdateTrackUseCase } from '@/domain/course-catalog/application/use-cases/update-track.use-case';
import { TrackController } from './track.controller';

import { GetTrackDto } from '@/domain/course-catalog/application/dtos/get-track.dto';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';
import { UpdateTrackDto } from '@/domain/course-catalog/application/dtos/update-track.dto';

class MockCreateTrackUseCase {
  execute = vi.fn();
}
class MockGetTrackUseCase {
  execute = vi.fn();
}
class MockListTracksUseCase {
  execute = vi.fn();
}
class MockDeleteTrackUseCase {
  execute = vi.fn();
}
class MockUpdateTrackUseCase {
  execute = vi.fn();
}

describe('TrackController', () => {
  let controller: TrackController;
  let createUseCase: MockCreateTrackUseCase;
  let getUseCase: MockGetTrackUseCase;
  let listUseCase: MockListTracksUseCase;
  let deleteUseCase: MockDeleteTrackUseCase;
  let updateUseCase: MockUpdateTrackUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateTrackUseCase();
    getUseCase = new MockGetTrackUseCase();
    listUseCase = new MockListTracksUseCase();
    deleteUseCase = new MockDeleteTrackUseCase();
    updateUseCase = new MockUpdateTrackUseCase();
    controller = new TrackController(
      createUseCase as any,
      getUseCase as any,
      listUseCase as any,
      deleteUseCase as any,
      updateUseCase as any,
    );
  });

  const baseCreateDto: CreateTrackDto = {
    slug: 'minha-trilha',
    courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
    translations: [
      { locale: 'pt', title: 'PT', description: 'Desc PT' },
      { locale: 'it', title: 'IT', description: 'Desc IT' },
      { locale: 'es', title: 'ES', description: 'Desc ES' },
    ],
  };

  const baseUpdateDto: UpdateTrackDto = {
    slug: 'trilha-atualizada',
    imageUrl: 'https://example.com/updated-image.jpg',
    courseIds: ['550e8400-e29b-41d4-a716-446655440001'],
    translations: [
      {
        locale: 'pt',
        title: 'PT Atualizado',
        description: 'Desc PT Atualizada',
      },
      {
        locale: 'it',
        title: 'IT Aggiornato',
        description: 'Desc IT Aggiornata',
      },
      {
        locale: 'es',
        title: 'ES Actualizado',
        description: 'Desc ES Actualizada',
      },
    ],
  };

  describe('create()', () => {
    it('creates track successfully without imageUrl', async () => {
      const payload = {
        track: {
          id: '1',
          slug: 'minha-trilha',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          title: 'PT',
          description: 'Desc PT',
          imageUrl: undefined,
        },
      };
      createUseCase.execute.mockResolvedValueOnce(right(payload));

      const res = await controller.create(baseCreateDto);
      expect(res).toEqual(payload.track);
      expect(res.imageUrl).toBeUndefined();
      expect(createUseCase.execute).toHaveBeenCalledWith({
        slug: baseCreateDto.slug,
        imageUrl: undefined,
        courseIds: baseCreateDto.courseIds,
        translations: baseCreateDto.translations,
      });
    });

    it('creates track successfully with imageUrl', async () => {
      const createDtoWithImage = {
        ...baseCreateDto,
        imageUrl: 'https://example.com/track-image.jpg',
      };
      const payload = {
        track: {
          id: '1',
          slug: 'minha-trilha',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          title: 'PT',
          description: 'Desc PT',
          imageUrl: 'https://example.com/track-image.jpg',
        },
      };
      createUseCase.execute.mockResolvedValueOnce(right(payload));

      const res = await controller.create(createDtoWithImage);
      expect(res).toEqual(payload.track);
      expect(res.imageUrl).toBe('https://example.com/track-image.jpg');
      expect(createUseCase.execute).toHaveBeenCalledWith({
        slug: createDtoWithImage.slug,
        imageUrl: createDtoWithImage.imageUrl,
        courseIds: createDtoWithImage.courseIds,
        translations: createDtoWithImage.translations,
      });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const details = [
        { path: ['imageUrl'], message: 'imageUrl must be a valid URL' },
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', details)),
      );

      const invalidDto = {
        ...baseCreateDto,
        imageUrl: 'invalid-url',
      };

      await expect(controller.create(invalidDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ConflictException on DuplicateTrackError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new DuplicateTrackError()),
      );

      await expect(controller.create(baseCreateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws InternalServerErrorException on generic error', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new Error('unexpected')),
      );

      await expect(controller.create(baseCreateDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getById()', () => {
    it('returns track without imageUrl on success', async () => {
      const payload = {
        track: {
          id: '1',
          slug: 'my-track',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          title: 'PT',
          description: 'Desc PT',
          imageUrl: undefined,
        },
      };
      getUseCase.execute.mockResolvedValueOnce(right(payload));

      const res = await controller.getById({ id: '1' } as GetTrackDto);
      expect(res).toEqual(payload.track);
      expect(res.imageUrl).toBeUndefined();
      expect(getUseCase.execute).toHaveBeenCalledWith({ id: '1' });
    });

    it('returns track with imageUrl on success', async () => {
      const payload = {
        track: {
          id: '1',
          slug: 'my-track',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          title: 'PT',
          description: 'Desc PT',
          imageUrl: 'https://example.com/track-image.jpg',
        },
      };
      getUseCase.execute.mockResolvedValueOnce(right(payload));

      const res = await controller.getById({ id: '1' } as GetTrackDto);
      expect(res).toEqual(payload.track);
      expect(res.imageUrl).toBe('https://example.com/track-image.jpg');
      expect(getUseCase.execute).toHaveBeenCalledWith({ id: '1' });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      getUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('fail', [])),
      );

      await expect(
        controller.getById({ id: 'bad' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException on TrackNotFoundError', async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new TrackNotFoundError()));

      await expect(
        controller.getById({ id: '1' } as GetTrackDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException on generic error', async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new Error('oops')));

      await expect(
        controller.getById({ id: '1' } as GetTrackDto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('list()', () => {
    it('returns tracks with imageUrl support on success', async () => {
      const tracks = [
        {
          id: '1',
          slug: 't1',
          courseIds: ['c1'],
          title: 'Track 1',
          description: 'Desc 1',
          imageUrl: 'https://example.com/image1.jpg',
          translations: [],
        },
        {
          id: '2',
          slug: 't2',
          courseIds: ['c2'],
          title: 'Track 2',
          description: 'Desc 2',
          imageUrl: undefined,
          translations: [],
        },
      ];
      listUseCase.execute.mockResolvedValueOnce(right({ tracks }));

      const result = await controller.list();
      expect(result).toEqual(tracks);
      expect(result[0].imageUrl).toBe('https://example.com/image1.jpg');
      expect(result[1].imageUrl).toBeUndefined();
      expect(listUseCase.execute).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException on error', async () => {
      listUseCase.execute.mockResolvedValueOnce(left(new Error('fail')));

      await expect(controller.list()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('update()', () => {
    const validTrackId = '550e8400-e29b-41d4-a716-446655440002';
    const updateParams = { id: validTrackId } as GetTrackDto;

    it('updates track successfully', async () => {
      const payload = {
        track: {
          id: validTrackId,
          slug: 'trilha-atualizada',
          courseIds: ['550e8400-e29b-41d4-a716-446655440001'],
          title: 'PT Atualizado',
          description: 'Desc PT Atualizada',
          imageUrl: 'https://example.com/updated-image.jpg',
          updatedAt: new Date('2025-06-30T15:00:00.000Z'),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(payload));

      const result = await controller.update(updateParams, baseUpdateDto);

      expect(result).toEqual(payload.track);
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: validTrackId,
        slug: baseUpdateDto.slug,
        imageUrl: baseUpdateDto.imageUrl,
        courseIds: baseUpdateDto.courseIds,
        translations: baseUpdateDto.translations,
      });
      expect(updateUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('updates track with empty courseIds array', async () => {
      const updateDtoEmptyCourses = {
        ...baseUpdateDto,
        courseIds: [],
      };
      const payload = {
        track: {
          id: validTrackId,
          slug: 'trilha-atualizada',
          courseIds: [],
          title: 'PT Atualizado',
          description: 'Desc PT Atualizada',
          imageUrl: 'https://example.com/updated-image.jpg',
          updatedAt: new Date('2025-06-30T15:00:00.000Z'),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(payload));

      const result = await controller.update(
        updateParams,
        updateDtoEmptyCourses,
      );

      expect(result).toEqual(payload.track);
      expect(result.courseIds).toEqual([]);
    });

    it('updates track removing imageUrl', async () => {
      const updateDtoNoImage = {
        ...baseUpdateDto,
        imageUrl: '',
      };
      const payload = {
        track: {
          id: validTrackId,
          slug: 'trilha-atualizada',
          courseIds: ['550e8400-e29b-41d4-a716-446655440001'],
          title: 'PT Atualizado',
          description: 'Desc PT Atualizada',
          imageUrl: '',
          updatedAt: new Date('2025-06-30T15:00:00.000Z'),
        },
      };
      updateUseCase.execute.mockResolvedValueOnce(right(payload));

      const result = await controller.update(updateParams, updateDtoNoImage);

      expect(result).toEqual(payload.track);
      expect(result.imageUrl).toBe('');
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const invalidInputError = new InvalidInputError('Invalid data format', [
        { path: ['slug'], message: 'Slug must be valid' },
      ]);
      updateUseCase.execute.mockResolvedValueOnce(left(invalidInputError));

      await expect(
        controller.update(updateParams, baseUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException on TrackNotFoundError', async () => {
      const trackNotFoundError = new TrackNotFoundError();
      updateUseCase.execute.mockResolvedValueOnce(left(trackNotFoundError));

      await expect(
        controller.update(updateParams, baseUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on DuplicateTrackError', async () => {
      const duplicateTrackError = new DuplicateTrackError();
      updateUseCase.execute.mockResolvedValueOnce(left(duplicateTrackError));

      await expect(
        controller.update(updateParams, baseUpdateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      updateUseCase.execute.mockResolvedValueOnce(left(repositoryError));

      await expect(
        controller.update(updateParams, baseUpdateDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on generic error', async () => {
      const genericError = new Error('Unexpected error occurred');
      updateUseCase.execute.mockResolvedValueOnce(left(genericError));

      await expect(
        controller.update(updateParams, baseUpdateDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('delete()', () => {
    const validTrackId = '550e8400-e29b-41d4-a716-446655440005';
    const deleteParams = { id: validTrackId } as GetTrackDto;

    it('deletes track successfully', async () => {
      const successResponse = {
        message: 'Track deleted successfully',
        deletedAt: new Date('2025-06-30T15:00:00.000Z'),
      };
      deleteUseCase.execute.mockResolvedValueOnce(right(successResponse));

      const result = await controller.delete(deleteParams);

      expect(result).toEqual(successResponse);
      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: validTrackId });
      expect(deleteUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const invalidInputError = new InvalidInputError('Invalid ID format', [
        { path: ['id'], message: 'ID must be a valid UUID' },
      ]);
      deleteUseCase.execute.mockResolvedValueOnce(left(invalidInputError));

      await expect(controller.delete(deleteParams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException on TrackNotFoundError', async () => {
      const trackNotFoundError = new TrackNotFoundError();
      deleteUseCase.execute.mockResolvedValueOnce(left(trackNotFoundError));

      await expect(controller.delete(deleteParams)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      deleteUseCase.execute.mockResolvedValueOnce(left(repositoryError));

      await expect(controller.delete(deleteParams)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException on generic error', async () => {
      const genericError = new Error('Unexpected error occurred');
      deleteUseCase.execute.mockResolvedValueOnce(left(genericError));

      await expect(controller.delete(deleteParams)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
