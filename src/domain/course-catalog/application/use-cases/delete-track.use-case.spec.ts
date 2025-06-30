// src/domain/course-catalog/application/use-cases/delete-track.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteTrackUseCase } from '@/domain/course-catalog/application/use-cases/delete-track.use-case';
import { InMemoryTrackRepository } from '@/test/repositories/in-memory-track-repository';
import { DeleteTrackRequest } from '@/domain/course-catalog/application/dtos/delete-track-request.dto';
import { TrackNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/track-not-found-error';
import { TrackHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/track-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';

let repo: InMemoryTrackRepository;
let sut: DeleteTrackUseCase;

describe('DeleteTrackUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryTrackRepository();
    sut = new DeleteTrackUseCase(repo);
  });

  function createValidTrack(id?: string, courseIds: string[] = []): Track {
    const trackId = id || new UniqueEntityID().toString();

    return Track.create(
      {
        slug: 'javascript-fundamentals',
        imageUrl: 'https://example.com/track.jpg',
        courseIds,
        translations: [
          new TrackTranslationVO(
            'pt',
            'Fundamentos JavaScript',
            'Aprenda os fundamentos do JavaScript',
          ),
          new TrackTranslationVO(
            'es',
            'Fundamentos de JavaScript',
            'Aprende los fundamentos de JavaScript',
          ),
        ],
      },
      new UniqueEntityID(trackId),
    );
  }

  function validDeleteRequest(id?: string): DeleteTrackRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a track successfully when it exists and has no dependencies', async () => {
      const track = createValidTrack();
      await repo.create(track);

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Track deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('returns success message with current timestamp', async () => {
      const track = createValidTrack();
      await repo.create(track);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(track.id.toString());
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
    it('rejects empty track ID', async () => {
      const request: any = { id: '' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.message).toBe('Invalid input data');
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Track ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects missing track ID', async () => {
      const request: any = {};
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Track ID is required',
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
              message: 'Track ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects non-string track ID', async () => {
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

    it('rejects null track ID', async () => {
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

  describe('Track not found errors', () => {
    it('returns TrackNotFoundError when track does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as TrackNotFoundError;
        expect(error).toBeInstanceOf(TrackNotFoundError);
        expect(error.message).toBe('Track not found');
      }
    });

    it('handles repository error when finding track', async () => {
      const trackId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validDeleteRequest(trackId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const trackId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Track lookup failed')),
      );

      const request = validDeleteRequest(trackId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as TrackNotFoundError;
        expect(error).toBeInstanceOf(TrackNotFoundError);
        expect(error.message).toBe('Track not found');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const track = createValidTrack();
      await repo.create(track);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const track = createValidTrack();
      await repo.create(track);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during track lookup', async () => {
      const trackId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(trackId);
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
    it('handles track with no dependencies', async () => {
      const track = createValidTrack();
      await repo.create(track);

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Track deleted successfully');
      }
    });

    it('handles track with empty courseIds array', async () => {
      const track = createValidTrack(undefined, []);
      await repo.create(track);

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Track deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      // UUID that passes regex but might fail in database
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as TrackNotFoundError;
        expect(error).toBeInstanceOf(TrackNotFoundError);
        expect(error.message).toBe('Track not found');
      }
    });

    it('verifies dependency information structure', async () => {
      const courseIds = [
        new UniqueEntityID().toString(),
        new UniqueEntityID().toString(),
        new UniqueEntityID().toString(),
      ];
      const track = createValidTrack(undefined, courseIds);
      await repo.create(track);

      repo.mockCourseDependencies.set(track.id.toString(), [
        {
          id: courseIds[0],
          slug: 'course-1',
          title: 'Introduction to Programming',
        },
        { id: courseIds[1], slug: 'course-2', title: 'Data Structures' },
        { id: courseIds[2], slug: 'course-3', title: 'Algorithms' },
      ]);

      // Testar o método checkTrackDependencies diretamente
      const dependenciesResult = await repo.checkTrackDependencies(
        track.id.toString(),
      );

      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(3);
        expect(info.summary.courses).toBe(3);
        expect(info.dependencies).toHaveLength(3);

        const firstDependency = info.dependencies[0];
        expect(firstDependency.type).toBe('course');
        expect(firstDependency.name).toBe('Introduction to Programming');
        expect(firstDependency.slug).toBe('course-1');
      }
    });

    it('handles track deletion when it is the only item in repository', async () => {
      const track = createValidTrack();
      await repo.create(track);
      expect(repo.items).toHaveLength(1);

      const request = validDeleteRequest(track.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(0);
    });

    it('handles track deletion when there are multiple tracks', async () => {
      const track1 = createValidTrack();
      const track2 = createValidTrack();
      const track3 = createValidTrack();

      await repo.create(track1);
      await repo.create(track2);
      await repo.create(track3);
      expect(repo.items).toHaveLength(3);

      const request = validDeleteRequest(track2.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(2);
      expect(repo.items.find((t) => t.id.equals(track2.id))).toBeUndefined();
      expect(repo.items.find((t) => t.id.equals(track1.id))).toBeDefined();
      expect(repo.items.find((t) => t.id.equals(track3.id))).toBeDefined();
    });
  });
});
