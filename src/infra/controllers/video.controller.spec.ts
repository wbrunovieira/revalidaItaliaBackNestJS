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
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { CreateVideoDto } from '@/domain/course-catalog/application/dtos/create-video.dto';
import { VideoController } from './video.controller';

type PrismaMock = {
  lesson: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  video: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

class MockCreateVideoUseCase {
  execute = vi.fn();
}
class MockGetVideoUseCase {
  execute = vi.fn();
}
class MockListVideosUseCase {
  execute = vi.fn();
}

describe('VideoController', () => {
  let controller: VideoController;
  let createUc: MockCreateVideoUseCase;
  let getUc: MockGetVideoUseCase;
  let listUc: MockListVideosUseCase;
  let prisma: PrismaMock;

  const courseId = 'course-1';
  const lessonId = 'lesson-1';

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
    createUc = new MockCreateVideoUseCase();
    getUc = new MockGetVideoUseCase();
    listUc = new MockListVideosUseCase();

    prisma = {
      lesson: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: lessonId, module: { courseId } }),
      },
      video: {
        findUnique: vi.fn().mockResolvedValue({ id: 'v1', lessonId }),
      },
    };

    controller = new VideoController(
      createUc as any,
      getUc as any,
      listUc as any,
      prisma as any,
    );
  });

  describe('create()', () => {
    it('→ retorna o vídeo criado quando tudo OK', async () => {
      const payload = {
        id: 'v1',
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        durationInSeconds: 42,
        isSeen: false,
        translations: dto.translations,
      };
      // include translations in mock return
      createUc.execute.mockResolvedValueOnce(
        right({ video: payload, translations: dto.translations }),
      );

      const res = await controller.create(courseId, lessonId, dto);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(createUc.execute).toHaveBeenCalledWith({
        lessonId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        translations: dto.translations,
      });
      expect(res).toEqual(payload);
    });

    it('→ lança NotFoundException se a lesson não existir ou pertencer a outro curso', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      prisma.lesson.findUnique.mockResolvedValueOnce({
        id: lessonId,
        module: { courseId: 'outro-curso' },
      });
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      createUc.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Bad', [{ path: ['slug'], message: 'X' }])),
      );
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança ConflictException em caso de DuplicateVideoError', async () => {
      createUc.execute.mockResolvedValueOnce(left(new DuplicateVideoError()));
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('→ lança NotFoundException em caso de LessonNotFoundError', async () => {
      createUc.execute.mockResolvedValueOnce(left(new LessonNotFoundError()));
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      createUc.execute.mockResolvedValueOnce(left(new Error('oops')));
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOne()', () => {
    it('→ retorna o vídeo quando tudo OK', async () => {
      const video = {
        id: 'v1',
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        durationInSeconds: 42,
        isSeen: false,
        translations: dto.translations,
      };
      getUc.execute.mockResolvedValueOnce(right({ video }));

      const out = await controller.findOne(courseId, lessonId, video.id);
      expect(prisma.video.findUnique).toHaveBeenCalledWith({
        where: { id: video.id },
      });
      expect(getUc.execute).toHaveBeenCalledWith({ id: video.id });
      expect(out).toEqual(video);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      getUc.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Bad', [{ path: ['id'], message: 'X' }])),
      );
      await expect(
        controller.findOne(courseId, lessonId, 'bad-uuid'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de VideoNotFoundError', async () => {
      getUc.execute.mockResolvedValueOnce(left(new VideoNotFoundError()));
      await expect(
        controller.findOne(courseId, lessonId, '1111-1111-1111-1111'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll()', () => {
    it('→ retorna lista de vídeos quando tudo OK', async () => {
      const list = [
        {
          id: 'v1',
          slug: 's',
          providerVideoId: 'p',
          durationInSeconds: 42,
          isSeen: false,
          translations: dto.translations,
        },
      ];
      listUc.execute.mockResolvedValueOnce(right({ videos: list }));

      const out = await controller.findAll(courseId, lessonId);
      expect(listUc.execute).toHaveBeenCalledWith({ lessonId });
      expect(out).toEqual(list);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      listUc.execute.mockResolvedValueOnce(
        left(
          new InvalidInputError('Bad', [{ path: ['lessonId'], message: 'X' }]),
        ),
      );
      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      listUc.execute.mockResolvedValueOnce(left(new Error('boom')));
      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
