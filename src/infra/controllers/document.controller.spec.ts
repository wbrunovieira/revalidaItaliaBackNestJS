// src/infra/controllers/document.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { DocumentController } from './document.controller';
import { CreateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/create-document.use-case';
import { ListDocumentsUseCase } from '@/domain/course-catalog/application/use-cases/list-documents.use-case';
import { GetDocumentUseCase } from '@/domain/course-catalog/application/use-cases/get-document.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { right, left } from '@/core/either';
import { CreateDocumentRequest } from '@/domain/course-catalog/application/dtos/create-document-request.dto';

// Mock the use cases
vi.mock(
  '@/domain/course-catalog/application/use-cases/create-document.use-case',
);
vi.mock(
  '@/domain/course-catalog/application/use-cases/list-documents.use-case',
);
vi.mock('@/domain/course-catalog/application/use-cases/get-document.use-case');

describe('DocumentController', () => {
  let controller: DocumentController;
  let createUc: CreateDocumentUseCase;
  let listUc: ListDocumentsUseCase;
  let getUc: GetDocumentUseCase;

  const lessonId = 'lesson-uuid';
  const documentId = 'doc-uuid';

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

  beforeEach(() => {
    createUc = new CreateDocumentUseCase({} as any, {} as any);
    listUc = new ListDocumentsUseCase({} as any, {} as any);
    getUc = new GetDocumentUseCase({} as any, {} as any);

    controller = new DocumentController(createUc, listUc, getUc);
  });

  describe('create()', () => {
    const body: Omit<CreateDocumentRequest, 'lessonId'> = {
      url: 'http://example.com/doc.pdf',
      filename: 'document.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      isDownloadable: true,
      translations: [],
    };

    it('returns created document payload when successful', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        right({ document: mockDocument, translations: [] }),
      );

      const result = await controller.create(lessonId, body);

      expect(createUc.execute).toHaveBeenCalledWith({ ...body, lessonId });
      expect(result).toEqual({
        id: mockDocument.id,
        url: mockDocument.url,
        filename: mockDocument.filename,
        title: mockDocument.title,
        fileSize: mockDocument.fileSize,
        fileSizeInMB: mockDocument.fileSizeInMB,
        mimeType: mockDocument.mimeType,
        isDownloadable: mockDocument.isDownloadable,
        downloadCount: mockDocument.downloadCount,
        createdAt: mockDocument.createdAt,
        updatedAt: mockDocument.updatedAt,
        translations: [],
      });
    });

    it('throws NotFoundException on LessonNotFoundError', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('fail', [])),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException on InvalidFileError', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new InvalidFileError('fail')),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ConflictException on DuplicateDocumentError', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new DuplicateDocumentError()),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws InternalServerErrorException on other errors', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new Error('unknown')),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll()', () => {
    it('returns list of documents when successful', async () => {
      const docs = [mockDocument];
      vi.mocked(listUc.execute).mockResolvedValueOnce(
        right({ documents: docs }),
      );

      const result = await controller.findAll(lessonId);

      expect(listUc.execute).toHaveBeenCalledWith({ lessonId });
      expect(result).toEqual(docs);
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      vi.mocked(listUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('fail', [])),
      );
      await expect(controller.findAll(lessonId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException on LessonNotFoundError', async () => {
      vi.mocked(listUc.execute).mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );
      await expect(controller.findAll(lessonId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on other errors', async () => {
      vi.mocked(listUc.execute).mockResolvedValueOnce(left(new Error('fail')));
      await expect(controller.findAll(lessonId)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne()', () => {
    it('returns single document when successful', async () => {
      vi.mocked(getUc.execute).mockResolvedValueOnce(
        right({ document: mockDocument }),
      );
      const result = await controller.findOne(lessonId, documentId);
      expect(getUc.execute).toHaveBeenCalledWith({ documentId, lessonId });
      expect(result).toEqual(mockDocument);
    });

    it('throws NotFoundException on LessonNotFoundError', async () => {
      vi.mocked(getUc.execute).mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );
      await expect(
        controller.findOne(lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      vi.mocked(getUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('fail', [])),
      );
      await expect(
        controller.findOne(lessonId, documentId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException on DocumentNotFoundError', async () => {
      vi.mocked(getUc.execute).mockResolvedValueOnce(
        left(new DocumentNotFoundError()),
      );
      await expect(
        controller.findOne(lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      vi.mocked(getUc.execute).mockResolvedValueOnce(
        left(new RepositoryError('fail')),
      );
      await expect(
        controller.findOne(lessonId, documentId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('incrementDownload()', () => {
    it('returns success message', async () => {
      const result = await controller.incrementDownload(lessonId, documentId);
      expect(result).toEqual({
        message: 'Download count incremented successfully',
        documentId,
      });
    });
  });
});
