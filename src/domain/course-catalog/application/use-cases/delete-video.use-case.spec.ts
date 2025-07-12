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
import { left, right } from '@/core/either';
import { VideoDependencyInfo } from '@/domain/course-catalog/application/dtos/video-dependencies.dto';

let repo: InMemoryVideoRepository;
let sut: DeleteVideoUseCase;

describe('DeleteVideoUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryVideoRepository();
    sut = new DeleteVideoUseCase(repo);
  });

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

  function validDeleteRequest(id?: string): DeleteVideoRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a video successfully when it exists and has no dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Video deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('returns success message with current timestamp', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(video.id.toString());
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
    it('rejects empty video ID', async () => {
      const request: any = { id: '' };
      const result = await sut.execute(request);

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

    it('rejects missing video ID', async () => {
      const request: any = {};
      const result = await sut.execute(request);

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
              message: 'Video ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects non-string video ID', async () => {
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

    it('rejects null video ID', async () => {
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

  describe('Video not found errors', () => {
    it('returns VideoNotFoundError when video does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });

    it('handles repository error when finding video', async () => {
      const videoId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validDeleteRequest(videoId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const videoId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Video lookup failed')),
      );

      const request = validDeleteRequest(videoId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });
  });

  describe('Video dependencies errors', () => {
    it('returns VideoHasDependenciesError when video has been seen by users', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      // Adicionar dependências simuladas (usuários que viram o vídeo)
      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            seenAt: new Date(),
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Maria Santos',
            seenAt: new Date(),
          },
        ],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
        expect(error.message).toContain('Viewed by João Silva');
        expect(error.message).toContain('Viewed by Maria Santos');
      }
    });

    it('returns VideoHasDependenciesError when video has translations', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      // Adicionar traduções como dependências
      repo.addDependenciesToVideo(video.id.toString(), {
        translations: [
          { id: '1', locale: 'pt', title: 'Vídeo Introdutório' },
          { id: '2', locale: 'en', title: 'Introduction Video' },
        ],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

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

    it('returns VideoHasDependenciesError when video has video links', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videoLinks: [
          { id: '1', locale: 'pt', streamUrl: 'https://stream-pt.com/video' },
          { id: '2', locale: 'en', streamUrl: 'https://stream-en.com/video' },
        ],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

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

    it('returns VideoHasDependenciesError when video has multiple types of dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            seenAt: new Date(),
          },
        ],
        translations: [{ id: '2', locale: 'pt', title: 'Vídeo Avançado' }],
        videoLinks: [
          { id: '3', locale: 'pt', streamUrl: 'https://stream.com/video' },
        ],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete video because it has dependencies',
        );
        expect(error.message).toContain('Viewed by João Silva');
        expect(error.message).toContain('Translation (pt): Vídeo Avançado');
        expect(error.message).toContain('Video Link (pt)');
      }
    });

    it('includes dependency info in error for frontend usage', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            seenAt: new Date(),
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Maria Santos',
            seenAt: new Date(),
          },
        ],
        translations: [{ id: '3', locale: 'pt', title: 'Teste Vídeo' }],
        videoLinks: [
          { id: '4', locale: 'pt', streamUrl: 'https://example.com' },
        ],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoHasDependenciesError;
        expect(error).toBeInstanceOf(VideoHasDependenciesError);

        // Verificar se a informação extra está disponível
        const errorWithInfo = error as any;
        expect(errorWithInfo.dependencyInfo).toBeDefined();
        expect(errorWithInfo.dependencyInfo.canDelete).toBe(false);
        expect(errorWithInfo.dependencyInfo.totalDependencies).toBe(4);
        expect(errorWithInfo.dependencyInfo.summary.videosSeen).toBe(2);
        expect(errorWithInfo.dependencyInfo.summary.translations).toBe(1);
        expect(errorWithInfo.dependencyInfo.summary.videoLinks).toBe(1);

        // Verificar detalhes das entidades relacionadas
        const seenDeps = errorWithInfo.dependencyInfo.dependencies.filter(
          (d: any) => d.type === 'video_seen',
        );
        expect(seenDeps).toHaveLength(2);
        expect(seenDeps[0].relatedEntities?.userName).toBe('João Silva');
        expect(seenDeps[1].relatedEntities?.userName).toBe('Maria Santos');
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'checkVideoDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Dependencies check failed');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during video lookup', async () => {
      const videoId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(videoId);
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
    it('handles video with no dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Video deleted successfully');
      }
    });

    it('handles video with empty dependency arrays', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [],
        translations: [],
        videoLinks: [],
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Video deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as VideoNotFoundError;
        expect(error).toBeInstanceOf(VideoNotFoundError);
        expect(error.message).toBe('Video not found');
      }
    });

    it('handles exception during dependencies check', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      vi.spyOn(repo, 'checkVideoDependencies').mockImplementationOnce(() => {
        throw new Error('Unexpected dependencies check error');
      });

      const request = validDeleteRequest(video.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected dependencies check error');
      }
    });

    it('verifies dependency information structure', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video = createValidVideo();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];
      await repo.create(lessonId, video, translations);

      repo.addDependenciesToVideo(video.id.toString(), {
        videosSeen: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
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

      // Testar o método checkVideoDependencies diretamente
      const dependenciesResult = await repo.checkVideoDependencies(
        video.id.toString(),
      );

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
        expect(seenDependency?.name).toBe('Viewed by João Silva');
        expect(seenDependency?.relatedEntities?.userId).toBe('user1');

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

    it('handles multiple videos from same lesson', async () => {
      const lessonId = new UniqueEntityID().toString();
      const video1 = createValidVideo();
      const video2 = createValidVideo();
      const video3 = createValidVideo();

      const translations = [
        {
          locale: 'pt' as const,
          title: 'Título PT',
          description: 'Descrição PT',
        },
      ];

      await repo.create(lessonId, video1, translations);
      await repo.create(lessonId, video2, translations);
      await repo.create(lessonId, video3, translations);

      // Deletar apenas o vídeo 2
      const request = validDeleteRequest(video2.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(2);

      // Verificar que os outros vídeos ainda existem
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
  });
});
