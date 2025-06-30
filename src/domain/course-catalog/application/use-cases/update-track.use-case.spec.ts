// src/domain/course-catalog/application/use-cases/update-track.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Either, left, right } from '@/core/either';
import { UpdateTrackUseCase } from './update-track.use-case';
import { ITrackRepository } from '../repositories/i-track-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { TrackNotFoundError } from './errors/track-not-found-error';
import { DuplicateTrackError } from './errors/duplicate-track-error';
import { RepositoryError } from './errors/repository-error';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { TrackDependencyInfo } from '../dtos/track-dependencies.dto';

class MockTrackRepository implements ITrackRepository {
  checkTrackDependencies(
    id: string,
  ): Promise<Either<Error, TrackDependencyInfo>> {
    throw new Error('Method not implemented.');
  }
  findById = vi.fn();
  findBySlug = vi.fn();
  update = vi.fn();
  create = vi.fn();
  delete = vi.fn();
  findAll = vi.fn();
}

describe('UpdateTrackUseCase', () => {
  let useCase: UpdateTrackUseCase;
  let repository: MockTrackRepository;

  beforeEach(() => {
    repository = new MockTrackRepository();
    useCase = new UpdateTrackUseCase(repository as any);
  });

  const existingTrack = Track.reconstruct(
    {
      slug: 'existing-track',
      imageUrl: 'https://example.com/image.jpg',
      courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
      translations: [
        new TrackTranslationVO('pt', 'Track PT', 'Description PT'),
        new TrackTranslationVO('it', 'Track IT', 'Description IT'), // Corrigido de 'en' para 'it'
      ],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
  );

  describe('successful updates', () => {
    it('should update track with new slug', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: 'updated-track',
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.findBySlug.mockResolvedValueOnce(
        left(new RepositoryError('Not found')),
      );
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.slug).toBe('updated-track');
        expect(result.value.track.id).toBe(
          '550e8400-e29b-41d4-a716-446655440001',
        );
      }
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    it('should update track with empty courseIds array', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        courseIds: [],
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.courseIds).toEqual([]);
      }
    });

    it('should update track with multiple courses', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        courseIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.courseIds).toEqual([
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ]);
      }
    });

    it('should update track with new translations', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        translations: [
          { locale: 'pt', title: 'Novo Título', description: 'Nova Descrição' },
          {
            locale: 'es',
            title: 'Nuevo Título',
            description: 'Nueva Descripción',
          },
        ],
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.title).toBe('Novo Título');
      }
    });

    it('should update track removing imageUrl', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        imageUrl: '',
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.imageUrl).toBe('');
      }
    });

    it('should update track with all fields', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: 'completely-updated',
        imageUrl: 'https://example.com/new-image.jpg',
        courseIds: [
          '550e8400-e29b-41d4-a716-446655440005',
          '550e8400-e29b-41d4-a716-446655440006',
        ],
        translations: [
          {
            locale: 'pt',
            title: 'Título Atualizado',
            description: 'Descrição Atualizada',
          },
          {
            locale: 'it',
            title: 'Titolo Aggiornato',
            description: 'Descrizione Aggiornata',
          },
        ],
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.findBySlug.mockResolvedValueOnce(
        left(new RepositoryError('Not found')),
      );
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.track.slug).toBe('completely-updated');
        expect(result.value.track.imageUrl).toBe(
          'https://example.com/new-image.jpg',
        );
        expect(result.value.track.courseIds).toEqual([
          '550e8400-e29b-41d4-a716-446655440005',
          '550e8400-e29b-41d4-a716-446655440006',
        ]);
        expect(result.value.track.title).toBe('Título Atualizado');
      }
    });
  });

  describe('validation errors', () => {
    it('should return InvalidInputError for invalid UUID', async () => {
      const request = {
        id: 'invalid-uuid',
        slug: 'test-slug',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid slug', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: '',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid imageUrl', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        imageUrl: 'not-a-valid-url',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid courseIds', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        courseIds: ['invalid-uuid'],
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid locale in translations', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        translations: [
          { locale: 'en', title: 'Title', description: 'Description' }, // Locale inválido
        ],
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('business logic errors', () => {
    it('should return TrackNotFoundError when track does not exist', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        slug: 'test-slug',
      };

      repository.findById.mockResolvedValueOnce(
        left(new RepositoryError('Not found')),
      );

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(TrackNotFoundError);
      }
    });

    it('should return DuplicateTrackError when new slug already exists', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: 'existing-slug',
      };

      const anotherTrack = Track.create({
        slug: 'existing-slug',
        courseIds: [],
        translations: [new TrackTranslationVO('pt', 'Title', 'Description')],
      });

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.findBySlug.mockResolvedValueOnce(right(anotherTrack));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateTrackError);
      }
    });

    it('should return RepositoryError when update fails', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: 'updated-slug',
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.findBySlug.mockResolvedValueOnce(
        left(new RepositoryError('Not found')),
      );
      repository.update.mockResolvedValueOnce(
        left(new RepositoryError('Database error')),
      );

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle unexpected errors', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        slug: 'test-slug',
      };

      repository.findById.mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('Unexpected error');
      }
    });

    it('should not call findBySlug when slug is not changed', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        courseIds: ['550e8400-e29b-41d4-a716-446655440008'],
      };

      repository.findById.mockResolvedValueOnce(right(existingTrack));
      repository.update.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repository.findBySlug).not.toHaveBeenCalled();
    });
  });
});
