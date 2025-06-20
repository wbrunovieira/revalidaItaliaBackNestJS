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
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { GetTrackUseCase } from '@/domain/course-catalog/application/use-cases/get-track.use-case';
import { ListTracksUseCase } from '@/domain/course-catalog/application/use-cases/list-tracks.use-case';
import { TrackController } from './track.controller';

import { GetTrackDto } from '@/domain/course-catalog/application/dtos/get-track.dto';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';

class MockCreateTrackUseCase {
  execute = vi.fn();
}
class MockGetTrackUseCase {
  execute = vi.fn();
}
class MockListTracksUseCase {
  execute = vi.fn();
}

describe('TrackController', () => {
  let controller: TrackController;
  let createUseCase: MockCreateTrackUseCase;
  let getUseCase: MockGetTrackUseCase;
  let listUseCase: MockListTracksUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateTrackUseCase();
    getUseCase = new MockGetTrackUseCase();
    listUseCase = new MockListTracksUseCase();
    controller = new TrackController(
      createUseCase as any,
      getUseCase as any,
      listUseCase as any,
    );
  });

  const baseCreateDto: CreateTrackDto = {
    slug: 'minha-trilha',
    courseIds: ['uuid-1'],
    translations: [
      { locale: 'pt', title: 'PT', description: 'Desc PT' },
      { locale: 'it', title: 'IT', description: 'Desc IT' },
      { locale: 'es', title: 'ES', description: 'Desc ES' },
    ],
  };

  describe('create()', () => {
    it('creates track successfully without imageUrl', async () => {
      const payload = {
        track: {
          id: '1',
          slug: 'minha-trilha',
          courseIds: ['uuid-1'],
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
          courseIds: ['uuid-1'],
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
          courseIds: ['uuid-1'],
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
          courseIds: ['uuid-1'],
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
});
