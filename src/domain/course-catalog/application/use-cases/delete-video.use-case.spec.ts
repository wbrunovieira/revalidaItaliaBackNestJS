// src/domain/course-catalog/application/use-cases/delete-video.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteVideoUseCase } from '@/domain/course-catalog/application/use-cases/delete-video.use-case';
import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
import { DeleteVideoRequest } from '@/domain/course-catalog/application/dtos/delete-video-request.dto';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { VideoHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/video-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
import { VideoTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/video-translation.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right, Either } from '@/core/either';
import { VideoDependencyInfo } from '@/domain/course-catalog/application/dtos/video-dependencies.dto';

// Helper function to create a valid video
function createValidVideo(id?: string): Video {
  const videoId = id || new UniqueEntityID().toString();

  return Video.create(
    {
      slug: 'video-teste',
      translations: [
        new VideoTranslationVO(
          'pt',
          'Vídeo de Teste',
          'Descrição do vídeo de teste',
        ),
        new VideoTranslationVO(
          'it',
          'Video di Prova',
          'Descrizione del video di prova',
        ),
        new VideoTranslationVO(
          'es',
          'Vídeo de Prueba',
          'Descripción del vídeo de prueba',
        ),
      ],
      providerVideoId: 'yt_abc123',
      durationInSeconds: 300,
    },
    new UniqueEntityID(videoId),
  );
}

// Helper function to create a valid delete request
function createValidDeleteRequest(overrides?: Partial<DeleteVideoRequest>): DeleteVideoRequest {
  return {
    id: new UniqueEntityID().toString(),
    ...overrides,
  };
}

// Helper function to create video translations for repository
function createVideoTranslations() {
  return [
    {
      locale: 'pt' as const,
      title: 'Título PT',
      description: 'Descrição PT',
    },
  ];
}

describe('DeleteVideoUseCase', () => {
  let repo: InMemoryVideoRepository;
  let sut: DeleteVideoUseCase;

  beforeEach(() => {
    repo = new InMemoryVideoRepository();
    sut = new DeleteVideoUseCase(repo);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should delete a video successfully when it exists and has no dependencies', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Video deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('should return success message with current timestamp', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      const beforeDeletion = new Date();
      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);
      const afterDeletion = new Date();

      // Assert
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

    it('should handle video with empty dependency arrays', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [],
        translations: [],
        videoLinks: [],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Video deleted successfully');
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty video ID', async () => {
      // Arrange
      const request: any = { id: '' };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Video ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('should return InvalidInputError for missing video ID', async () => {
      // Arrange
      const request: any = {};

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Video ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('should return InvalidInputError for invalid UUID format', async () => {
      // Arrange
      const request: any = { id: 'invalid-uuid' };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Video ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('should return InvalidInputError for non-string video ID', async () => {
      // Arrange
      const request: any = { id: 123 };

      // Act
      const result = await sut.execute(request);

      // Assert
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

    it('should return InvalidInputError for null video ID', async () => {
      // Arrange
      const request: any = { id: null };

      // Act
      const result = await sut.execute(request);

      // Assert
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

  // Business Rule Errors
  describe('Business Rule Errors', () => {
    it('should return VideoNotFoundError when video does not exist', async () => {
      // Arrange
      const nonExistentId = new UniqueEntityID().toString();
      const request = createValidDeleteRequest({ id: nonExistentId });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });

    it('should return VideoHasDependenciesError when video has been seen by users', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      // Add dependencies (users who have seen the video)
      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            identityId: 'user1',
            seenAt: new Date(),
          },
          {
            id: '2',
            identityId: 'user2',
            seenAt: new Date(),
          },
        ],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
      }
    });

    it('should return VideoHasDependenciesError when video has translations', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      // Add translations as dependencies
      repo.addDependenciesToVideo(video.id.toString(), {
        translations: [
          { id: '1', locale: 'pt', title: 'Vídeo Introdutório' },
          { id: '2', locale: 'en', title: 'Introduction Video' },
        ],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
        expect(error.message).toContain('Translation (pt): Vídeo Introdutório');
        expect(error.message).toContain('Translation (en): Introduction Video');
      }
    });

    it('should return VideoHasDependenciesError when video has video links', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videoLinks: [
          { id: '1', locale: 'pt', streamUrl: 'https://stream-pt.com/video' },
          { id: '2', locale: 'en', streamUrl: 'https://stream-en.com/video' },
        ],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
        expect(error.message).toContain('Video Link (pt)');
        expect(error.message).toContain('Video Link (en)');
      }
    });

    it('should return VideoHasDependenciesError with multiple types of dependencies', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            identityId: 'user1',
            seenAt: new Date(),
          },
        ],
        translations: [{ id: '2', locale: 'pt', title: 'Vídeo Avançado' }],
        videoLinks: [
          { id: '3', locale: 'pt', streamUrl: 'https://stream.com/video' },
        ],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
      }
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when finding video fails', async () => {
      // Arrange
      const videoId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = createValidDeleteRequest({ id: videoId });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('should handle Left result from repository.findById', async () => {
      // Arrange
      const videoId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Video lookup failed')),
      );

      const request = createValidDeleteRequest({ id: videoId });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });

    it('should return RepositoryError when checking dependencies fails', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'checkVideoDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Dependencies check failed');
      }
    });

    it('should return RepositoryError during deletion', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('should handle unexpected exception during deletion', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle malformed UUID that passes regex but fails in repository', async () => {
      // Arrange
      const malformedId = '12345678-1234-1234-1234-123456789012';
      const request = createValidDeleteRequest({ id: malformedId });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });

    it('should handle multiple videos from same lesson', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video1 = createValidVideo();
      const video2 = createValidVideo();
      const video3 = createValidVideo();

      const translations = createVideoTranslations();

      await repo.create(lessonId, video1, translations);
      await repo.create(lessonId, video2, translations);
      await repo.create(lessonId, video3, translations);

      // Delete only video 2
      const request = createValidDeleteRequest({ id: video2.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(2);

      // Verify that other videos still exist
      const remainingVideos = await repo.findByLesson(lessonId);
      expect(remainingVideos.isRight()).toBe(true);
      if (remainingVideos.isRight()) {
        expect(remainingVideos.value).toHaveLength(2);
        const remainingIds = remainingVideos.value.map((v) =>
          v.video.id.toString(),
        );
        expect(remainingIds).toContain(video1.id.toString());
        expect(remainingIds).toContain(video3.id.toString());
        expect(remainingIds).not.toContain(video2.id.toString());
      }
    });

    it('should verify dependency information structure', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            identityId: 'user1',
            seenAt: new Date(),
          },
        ],
        translations: [
          { id: '2', locale: 'pt', title: 'Vídeo Teste' },
          { id: '3', locale: 'en', title: 'Test Video' },
        ],
        videoLinks: [
          { id: '4', locale: 'pt', streamUrl: 'https://stream.com' },
        ],
      });

      // Test checkVideoDependencies directly
      const dependenciesResult = await repo.checkVideoDependencies(
        video.id.toString(),
      );

      // Assert
      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(4);
        expect(info.summary.videosSeen).toBe(1);
        expect(info.summary.translations).toBe(2);
        expect(info.summary.videoLinks).toBe(1);
        expect(info.dependencies).toHaveLength(4);

        const seenDependency = info.dependencies.find(
          (d) => d.type === 'video_seen',
        );
        expect(seenDependency).toBeDefined();
        expect(seenDependency?.relatedEntities?.identityId).toBe('user1');

        const translationDeps = info.dependencies.filter(
          (d) => d.type === 'translation',
        );
        expect(translationDeps).toHaveLength(2);

        const linkDependency = info.dependencies.find(
          (d) => d.type === 'video_link',
        );
        expect(linkDependency).toBeDefined();
        expect(linkDependency?.name).toBe('Video Link (pt)');
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should delete video efficiently even with many videos in repository', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const translations = createVideoTranslations();

      // Create many videos
      for (let i = 0; i < 100; i++) {
        const video = createValidVideo();
        await repo.create(lessonId, video, translations);
      }

      // Create target video
      const targetVideo = createValidVideo();
      await repo.create(lessonId, targetVideo, translations);

      const request = createValidDeleteRequest({ id: targetVideo.id.toString() });
      const start = Date.now();

      // Act
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should not allow deletion of video with active dependencies', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = createVideoTranslations();
      await repo.create(lessonId, video, translations);

      // Add active dependencies
      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            identityId: 'user1',
            seenAt: new Date(),
          },
        ],
      });

      const request = createValidDeleteRequest({ id: video.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(VideoHasDependenciesError);
      }
    });

    it('should ensure video exists before attempting deletion', async () => {
      // Arrange
      const nonExistentId = new UniqueEntityID().toString();
      const request = createValidDeleteRequest({ id: nonExistentId });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(VideoNotFoundError);
      }
    });

    it('should validate input data before processing', async () => {
      // Arrange
      const request: any = {
        id: 'not-a-uuid',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });
});