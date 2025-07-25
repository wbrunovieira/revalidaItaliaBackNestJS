import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateVideoError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { LessonNotFoundError as UpdateLessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found.error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { VideoHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/video-has-dependencies-error';
import { CreateVideoDto } from '@/domain/course-catalog/application/dtos/create-video.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';
import { VideoController } from './video.controller';

describe('VideoController', () => {
  let controller: VideoController;
  let createUc: any;
  let getUc: any;
  let updateUc: any;
  let listUc: any;
  let deleteUc: any;
  let prisma: any;

  const courseId = 'course-1';
  const lessonId = 'lesson-1';
  const videoId = 'video-1';

  const dto: CreateVideoDto = {
    slug: 'video-slug',
    providerVideoId: 'provVid',
    translations: [
      { locale: 'pt', title: 'T1', description: 'D1' },
      { locale: 'it', title: 'T2', description: 'D2' },
      { locale: 'es', title: 'T3', description: 'D3' },
    ],
  };

  beforeEach(() => {
    createUc = { execute: vi.fn() };
    getUc = { execute: vi.fn() };
    updateUc = { execute: vi.fn() };
    listUc = { execute: vi.fn() };
    deleteUc = { execute: vi.fn() };

    prisma = {
      lesson: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: lessonId, module: { courseId } }),
      },
      video: {
        findUnique: vi.fn().mockResolvedValue({ id: videoId, lessonId }),
      },
    };

    controller = new VideoController(
      createUc,
      getUc,
      updateUc,
      listUc,
      deleteUc,
      prisma,
    );
  });

  describe('update()', () => {
    const updateDto: UpdateVideoDto = {
      slug: 'updated-video-slug',
      imageUrl: 'https://example.com/image.jpg',
      providerVideoId: 'newProviderVideoId',
      durationInSeconds: 120,
      lessonId: 'new-lesson-id',
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
        {
          locale: 'es',
          title: 'Título Actualizado',
          description: 'Descripción Actualizada',
        },
      ],
    };

    it('→ atualiza o vídeo e retorna mensagem de sucesso quando tudo OK', async () => {
      const mockVideoResponse = {
        video: {
          id: videoId,
          slug: 'updated-video-slug',
          imageUrl: 'https://example.com/image.jpg',
          providerVideoId: 'newProviderVideoId',
          durationInSeconds: 120,
          lessonId: 'new-lesson-id',
          translations: updateDto.translations,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      updateUc.execute.mockResolvedValue(right(mockVideoResponse));

      const result = await controller.update(
        courseId,
        lessonId,
        videoId,
        updateDto,
      );

      expect(updateUc.execute).toHaveBeenCalledWith({
        videoId,
        ...updateDto,
      });
      expect(result).toEqual(mockVideoResponse.video);
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se lesson não pertencer ao course', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        module: { courseId: 'other-course' },
      });

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se vídeo não existir', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se vídeo não pertencer à lesson', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: videoId,
        lessonId: 'other-lesson',
      });

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ valida nova lesson quando lessonId é fornecido', async () => {
      const updateWithNewLesson = { ...updateDto, lessonId: 'new-lesson-id' };

      // Mock para a nova lesson
      prisma.lesson.findUnique
        .mockResolvedValueOnce({ id: lessonId, module: { courseId } }) // lesson atual
        .mockResolvedValueOnce({ id: 'new-lesson-id', module: { courseId } }); // nova lesson

      updateUc.execute.mockResolvedValue(
        right({ message: 'Video updated successfully' }),
      );

      await controller.update(courseId, lessonId, videoId, updateWithNewLesson);

      expect(prisma.lesson.findUnique).toHaveBeenCalledTimes(2);
    });

    it('→ lança NotFoundException se nova lesson não existir', async () => {
      const updateWithNewLesson = { ...updateDto, lessonId: 'new-lesson-id' };

      prisma.lesson.findUnique
        .mockResolvedValueOnce({ id: lessonId, module: { courseId } }) // lesson atual existe
        .mockResolvedValueOnce(null); // nova lesson não existe

      await expect(
        controller.update(courseId, lessonId, videoId, updateWithNewLesson),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      updateUc.execute.mockResolvedValue(
        left(
          new InvalidInputError('Validation failed', [
            { path: ['slug'], message: 'Invalid slug format' },
          ]),
        ),
      );

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de VideoNotFoundError', async () => {
      updateUc.execute.mockResolvedValue(left(new VideoNotFoundError()));

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException em caso de LessonNotFoundError', async () => {
      updateUc.execute.mockResolvedValue(
        left(new UpdateLessonNotFoundError('lesson-id')),
      );

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança ConflictException em caso de DuplicateVideoError', async () => {
      updateUc.execute.mockResolvedValue(left(new DuplicateVideoError()));

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      updateUc.execute.mockResolvedValue(
        left(new Error('Database connection failed')),
      );

      await expect(
        controller.update(courseId, lessonId, videoId, updateDto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('→ permite atualização parcial do vídeo', async () => {
      const partialUpdate: UpdateVideoDto = {
        slug: 'new-slug',
      };

      updateUc.execute.mockResolvedValue(
        right({ message: 'Video updated successfully' }),
      );

      await controller.update(courseId, lessonId, videoId, partialUpdate);

      expect(updateUc.execute).toHaveBeenCalledWith({
        videoId,
        slug: 'new-slug',
      });
    });

    it('→ permite remover lesson do vídeo com lessonId null', async () => {
      const updateWithNullLesson: UpdateVideoDto = {
        lessonId: null,
      };

      updateUc.execute.mockResolvedValue(
        right({ message: 'Video updated successfully' }),
      );

      await controller.update(
        courseId,
        lessonId,
        videoId,
        updateWithNullLesson,
      );

      expect(updateUc.execute).toHaveBeenCalledWith({
        videoId,
        lessonId: null,
      });
    });
  });

  describe('create()', () => {
    it('→ retorna o vídeo criado quando tudo OK', async () => {
      const payload = {
        id: videoId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        durationInSeconds: 42,
        isSeen: false,
        translations: dto.translations,
      };

      createUc.execute.mockResolvedValue(
        right({ video: payload, translations: dto.translations }),
      );

      const res = await controller.create(courseId, lessonId, dto);

      expect(createUc.execute).toHaveBeenCalledWith({
        lessonId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        translations: dto.translations,
      });
      expect(res).toEqual(payload);
    });

    it('→ lança NotFoundException se a lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      createUc.execute.mockResolvedValue(
        left(new InvalidInputError('Bad', [{ path: ['slug'], message: 'X' }])),
      );

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança ConflictException em caso de DuplicateVideoError', async () => {
      createUc.execute.mockResolvedValue(left(new DuplicateVideoError()));

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('→ lança NotFoundException em caso de LessonNotFoundError', async () => {
      createUc.execute.mockResolvedValue(left(new LessonNotFoundError()));

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      createUc.execute.mockResolvedValue(left(new Error('oops')));

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOne()', () => {
    it('→ retorna o vídeo quando tudo OK', async () => {
      const video = {
        id: videoId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        durationInSeconds: 42,
        isSeen: false,
        translations: dto.translations,
      };

      getUc.execute.mockResolvedValue(right({ video }));

      const out = await controller.findOne(courseId, lessonId, videoId);

      expect(getUc.execute).toHaveBeenCalledWith({ id: videoId });
      expect(out).toEqual(video);
    });

    it('→ lança NotFoundException se vídeo não pertencer à lesson', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: videoId,
        lessonId: 'other-lesson',
      });

      await expect(
        controller.findOne(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      getUc.execute.mockResolvedValue(
        left(new InvalidInputError('Bad', [{ path: ['id'], message: 'X' }])),
      );

      await expect(
        controller.findOne(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de VideoNotFoundError', async () => {
      getUc.execute.mockResolvedValue(left(new VideoNotFoundError()));

      await expect(
        controller.findOne(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll()', () => {
    it('→ retorna lista de vídeos quando tudo OK', async () => {
      const list = [
        {
          id: videoId,
          slug: 's',
          providerVideoId: 'p',
          durationInSeconds: 42,
          isSeen: false,
          translations: dto.translations,
        },
      ];

      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'listVideos', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(right({ videos: list })),
      });

      const out = await controller.findAll(courseId, lessonId);

      expect(out).toEqual(list);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'listVideos', 'get').mockReturnValue({
        execute: vi
          .fn()
          .mockResolvedValue(
            left(
              new InvalidInputError('Bad', [
                { path: ['lessonId'], message: 'X' },
              ]),
            ),
          ),
      });

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'listVideos', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(left(new Error('boom'))),
      });

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('remove()', () => {
    it('→ deleta o vídeo e retorna mensagem de sucesso quando tudo OK', async () => {
      const deleteResponse = {
        message: 'Video deleted successfully',
        deletedAt: new Date('2025-07-03T10:30:00.000Z'),
      };

      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(right(deleteResponse)),
      });

      const result = await controller.remove(courseId, lessonId, videoId);

      expect(result).toEqual(deleteResponse);
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se lesson não pertencer ao course', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        module: { courseId: 'other-course' },
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se vídeo não existir', async () => {
      prisma.video.findUnique.mockResolvedValue(null);

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se vídeo não pertencer à lesson', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: videoId,
        lessonId: 'other-lesson',
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi
          .fn()
          .mockResolvedValue(
            left(
              new InvalidInputError('Bad input', [
                { path: ['id'], message: 'Invalid UUID' },
              ]),
            ),
          ),
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de VideoNotFoundError do use case', async () => {
      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(left(new VideoNotFoundError())),
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança ConflictException em caso de VideoHasDependenciesError', async () => {
      const dependencyInfo = {
        canDelete: false,
        totalDependencies: 2,
        summary: {
          videosSeen: 2,
          translations: 3,
          videoLinks: 2,
        },
        dependencies: [
          {
            type: 'video_seen' as const,
            id: 'seen-1',
            name: 'Viewed by João Silva',
            relatedEntities: {
              userId: 'user-1',
              userName: 'João Silva',
            },
          },
          {
            type: 'video_seen' as const,
            id: 'seen-2',
            name: 'Viewed by Maria Santos',
            relatedEntities: {
              userId: 'user-2',
              userName: 'Maria Santos',
            },
          },
        ],
      };

      const dependencyError = new VideoHasDependenciesError(
        ['Viewed by João Silva', 'Viewed by Maria Santos'],
        dependencyInfo,
      );

      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(left(dependencyError)),
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi
          .fn()
          .mockResolvedValue(left(new Error('Database connection failed'))),
      });

      await expect(
        controller.remove(courseId, lessonId, videoId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('→ valida se todos os parâmetros são UUIDs válidos', async () => {
      const deleteResponse = {
        message: 'Video deleted successfully',
        deletedAt: new Date('2025-07-03T10:30:00.000Z'),
      };

      // Spy direto na propriedade do controller
      vi.spyOn(controller as any, 'deleteVideo', 'get').mockReturnValue({
        execute: vi.fn().mockResolvedValue(right(deleteResponse)),
      });

      const result = await controller.remove(courseId, lessonId, videoId);

      expect(result).toEqual(deleteResponse);
    });
  });
});
