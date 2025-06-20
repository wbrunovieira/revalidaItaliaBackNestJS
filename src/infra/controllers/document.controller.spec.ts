// src/infra/controllers/document.controller.spec.ts (versão corrigida completa)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { DocumentController } from './document.controller';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { left, right } from '@/core/either';

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

class MockGetDocumentUseCase {
  execute = vi.fn();
}

class MockListDocumentsUseCase {
  execute = vi.fn();
}

describe('DocumentController', () => {
  let controller: DocumentController;
  let createUc: MockCreateDocumentUseCase;
  let listUc: MockListDocumentsUseCase;
  let getUc: MockGetDocumentUseCase;
  let prisma: PrismaMock;

  const courseId = 'course-uuid';
  const lessonId = 'lesson-uuid';
  const documentId = 'doc-uuid';

  beforeEach(() => {
    createUc = new MockCreateDocumentUseCase();
    listUc = new MockListDocumentsUseCase();
    getUc = new MockGetDocumentUseCase();

    prisma = {
      lesson: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: lessonId, module: { courseId } }),
      },
      lessonDocument: {
        findUnique: vi.fn().mockResolvedValue({ id: documentId, lessonId }),
      },
    };

    controller = new DocumentController(
      createUc as any,
      listUc as any,
      getUc as any,
      prisma as any,
    );
  });

  describe('create()', () => {
    const createBody = {
      url: 'http://example.com/doc.pdf',
      filename: 'document.pdf',
      title: 'Test Document',
      fileSize: 1024,
      mimeType: 'application/pdf',
      isDownloadable: true,
      translations: [],
    };

    it('→ retorna o documento criado quando tudo OK', async () => {
      // Mock do use case retornando sucesso
      const mockResult = {
        document: {
          id: documentId,
          ...createBody,
          fileSizeInMB: 0.001,
          downloadCount: 0,
        },
        translations: [],
      };

      createUc.execute.mockResolvedValueOnce(right(mockResult));

      const result = await controller.create(courseId, lessonId, createBody);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(createUc.execute).toHaveBeenCalledWith({
        ...createBody,
        lessonId,
      });
      expect(result).toEqual({
        id: documentId,
        ...createBody,
        fileSizeInMB: 0.001,
        downloadCount: 0,
        translations: [],
      });
    });

    it('→ lança NotFoundException se a lesson não existir ou pertencer a outro curso', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(NotFoundException);

      prisma.lesson.findUnique.mockResolvedValueOnce({
        id: lessonId,
        module: { courseId: 'outro-curso' },
      });

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      const error = new InvalidInputError('Validation failed', []);
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança BadRequestException em caso de InvalidFileError', async () => {
      const error = new InvalidFileError('Invalid file');
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança ConflictException em caso de DuplicateDocumentError', async () => {
      const error = new DuplicateDocumentError();
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('→ lança NotFoundException em caso de LessonNotFoundError', async () => {
      const error = new LessonNotFoundError();
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      const error = new Error('Unknown error');
      createUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.create(courseId, lessonId, createBody),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOne()', () => {
    it('→ retorna documento quando tudo OK', async () => {
      // Mock do use case retornando sucesso
      const mockDocument = {
        id: documentId,
        url: 'http://example.com/doc.pdf',
        filename: 'document.pdf',
        title: 'Test Document',
        fileSize: 1024,
        fileSizeInMB: 0.001,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
      };

      getUc.execute.mockResolvedValueOnce(right({ document: mockDocument }));

      const result = await controller.findOne(courseId, lessonId, documentId);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { module: { select: { courseId: true } } },
      });
      expect(getUc.execute).toHaveBeenCalledWith({
        documentId,
        lessonId,
      });
      expect(result).toEqual(mockDocument);
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.findOne(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      const error = new InvalidInputError('Validation failed', []);
      getUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.findOne(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de DocumentNotFoundError', async () => {
      const error = new DocumentNotFoundError();
      getUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.findOne(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança InternalServerErrorException em caso de RepositoryError', async () => {
      const error = new RepositoryError('Database error');
      getUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.findOne(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAll()', () => {
    it('→ retorna lista de documentos quando tudo OK', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          url: 'http://example.com/doc1.pdf',
          filename: 'document1.pdf',
          title: 'Document 1',
        },
      ];

      listUc.execute.mockResolvedValueOnce(right({ documents: mockDocuments }));

      const result = await controller.findAll(courseId, lessonId);

      expect(listUc.execute).toHaveBeenCalledWith({ lessonId });
      expect(result).toEqual(mockDocuments);
    });

    it('→ retorna array vazio quando lesson não tem documentos', async () => {
      listUc.execute.mockResolvedValueOnce(right({ documents: [] }));

      const result = await controller.findAll(courseId, lessonId);

      expect(result).toEqual([]);
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança BadRequestException em caso de InvalidInputError', async () => {
      const error = new InvalidInputError('Validation failed', []);
      listUc.execute.mockResolvedValueOnce(left(error));

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('→ lança NotFoundException em caso de LessonNotFoundError', async () => {
      listUc.execute.mockResolvedValueOnce(left(new LessonNotFoundError()));

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança InternalServerErrorException em outros erros', async () => {
      listUc.execute.mockResolvedValueOnce(left(new Error('Unknown error')));

      await expect(
        controller.findAll(courseId, lessonId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('incrementDownload()', () => {
    it('→ retorna mensagem de sucesso quando tudo OK', async () => {
      const result = await controller.incrementDownload(
        courseId,
        lessonId,
        documentId,
      );

      expect(result).toEqual({
        message: 'Download count incremented successfully',
        documentId,
      });
    });

    it('→ lança NotFoundException se lesson não existir', async () => {
      prisma.lesson.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.incrementDownload(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('→ lança NotFoundException se documento não pertencer à lesson', async () => {
      const mockDocument = { id: documentId, lessonId: 'other-lesson-id' };
      prisma.lessonDocument.findUnique.mockResolvedValueOnce(mockDocument);

      await expect(
        controller.incrementDownload(courseId, lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
