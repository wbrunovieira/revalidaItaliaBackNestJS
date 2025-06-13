// src/infra/course-catalog/controllers/track.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { TrackController } from './track.controller';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';


class MockCreateTrackUseCase {
  execute = vi.fn();
}

describe('TrackController', () => {
  let controller: TrackController;
  let createUseCase: MockCreateTrackUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateTrackUseCase();
    controller = new TrackController(createUseCase as any);
  });

  describe('create()', () => {
    const dto: CreateTrackDto = {
      slug: 'minha-trilha',
      courseIds: ['uuid-1', 'uuid-2'],
      translations: [
        { locale: 'pt', title: 'Trilha PT', description: 'Descrição PT' },
        { locale: 'it', title: 'Traccia IT', description: 'Descrizione IT' },
        { locale: 'es', title: 'Pista ES', description: 'Descripción ES' },
      ],
    };

    it('returns track payload on success', async () => {
      const payload = {
        track: {
          id: '1111-2222-3333-4444',
          slug: dto.slug,
          courseIds: dto.courseIds,
          title: 'Trilha PT',
          description: 'Descrição PT',
        },
      };
      createUseCase.execute.mockResolvedValueOnce(right(payload));

      const response = await controller.create(dto);
      expect(response).toEqual(payload.track);
      expect(createUseCase.execute).toHaveBeenCalledWith({
        slug: dto.slug,
        courseIds: dto.courseIds,
        translations: dto.translations,
      });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      const details = [{ path: ['slug'], message: 'Too short' }];
      createUseCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validation failed', details)));

      await expect(controller.create(dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException on DuplicateTrackError', async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new DuplicateTrackError()));

      await expect(controller.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new Error('unexpected')));

      await expect(controller.create(dto)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});