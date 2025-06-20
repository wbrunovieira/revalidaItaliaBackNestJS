// src/infra/controllers/document.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';
import { CreateDocumentDto } from '@/domain/course-catalog/application/dtos/create-document.dto';
import { DocumentController } from './document.controller';

type PrismaMock = {
  lesson: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  lessonDocument: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

class MockCreateDocumentUseCase {
  execute = vi.fn();
}

describe('DocumentController', () => {
  let controller: DocumentController;
  let createUc: MockCreateDocumentUseCase;
  let prisma: PrismaMock;

  const courseId = 'course-1';
  const lessonId = 'lesson-1';

  const dto: Omit<CreateDocumentDto, 'lessonId'> = {
    url: 'https://example.com/document.pdf',
    filename: 'material-curso.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    isDownloadable: true,
    translations: [
      { locale: 'pt', title: 'Material do Curso', description: 'Desc PT' },
      { locale: 'it', title: 'Materiale del Corso', description: 'Desc IT' },
      { locale: 'es', title: 'Material del Curso', description: 'Desc ES' },
    ],
  };

  beforeEach(() => {
    createUc = new MockCreateDocumentUseCase();

    prisma = {
      lesson: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: lessonId, module: { courseId } }),
      },
      lessonDocument: {
        findUnique: vi.fn().mockResolvedValue({ id: 'doc-1', lessonId }),
      },
    };

    controller = new DocumentController(createUc as any, prisma as any);
  });

  describe('create()', () => {
    it('→ retorna o documento criado quando tudo OK', async () => {
      const payload = {
        id: 'doc-1',
        url: dto.url,
        filename: dto.filename,
        title: 'Material do Curso',
        fileSize: dto.fileSize,
        fileSizeInMB: 1,
        mimeType: dto.mimeType,
        isDownloadable: dto.isDownloadable,
        downloadCount: 0,
        translations: dto.translations,
      };

      createUc.execute.mockResolvedValueOnce(
        right({ document: payload, translations: dto.translations }),
      );

      const res = await controller.create(courseId, lessonId, dto);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(createUc.execute).toHaveBeenCalledWith({
        lessonId,
        url: dto.url,
        filename: dto.filename,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        isDownloadable: dto.isDownloadable,
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
      const error = new InvalidInputError('Validation failed', [
        {
          path: ['filename'],
          message: 'Invalid filename',
          code: 'invalid_string',
        },
      ]);
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança BadRequestException em caso de InvalidFileError', async () => {
      createUc.execute.mockResolvedValueOnce(
        left(new InvalidFileError('File too large')),
      );
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança ConflictException em caso de DuplicateDocumentError', async () => {
      createUc.execute.mockResolvedValueOnce(
        left(new DuplicateDocumentError()),
      );
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
      createUc.execute.mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );
      await expect(
        controller.create(courseId, lessonId, dto),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOne()', () => {
    it('→ retorna mensagem de endpoint não implementado quando tudo OK', async () => {
      const documentId = 'doc-1';

      const result = await controller.findOne(courseId, lessonId, documentId);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(prisma.lessonDocument.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(result).toEqual({
        message: 'Get document endpoint - to be implemented',
        documentId,
      });
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.findOne(courseId, lessonId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se documento não pertencer à lesson', async () => {
      prisma.lessonDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        lessonId: 'other-lesson-id',
      });

      await expect(
        controller.findOne(courseId, lessonId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se documento não existir', async () => {
      prisma.lessonDocument.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.findOne(courseId, lessonId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll()', () => {
    it('→ retorna mensagem de endpoint não implementado quando tudo OK', async () => {
      const result = await controller.findAll(courseId, lessonId);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(result).toEqual({
        message: 'List documents endpoint - to be implemented',
        lessonId,
      });
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('incrementDownload()', () => {
    it('→ retorna mensagem de sucesso quando tudo OK', async () => {
      const documentId = 'doc-1';

      const result = await controller.incrementDownload(
        courseId,
        lessonId,
        documentId,
      );

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(prisma.lessonDocument.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(result).toEqual({
        message: 'Download count incremented successfully',
        documentId,
      });
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.incrementDownload(courseId, lessonId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se documento não pertencer à lesson', async () => {
      prisma.lessonDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        lessonId: 'other-lesson-id',
      });

      await expect(
        controller.incrementDownload(courseId, lessonId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
