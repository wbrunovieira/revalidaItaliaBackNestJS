//src/infra/controllers/document.controller.spec.ts
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
import { DeleteDocumentUseCase } from '@/domain/course-catalog/application/use-cases/delete-document.use-case';
import { UpdateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/update-document.use-case';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { DocumentHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/document-has-dependencies-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { right, left } from '@/core/either';
import { CreateDocumentRequest } from '@/domain/course-catalog/application/dtos/create-document-request.dto';
import { UpdateDocumentRequest } from '@/domain/course-catalog/application/dtos/update-document-request.dto';
import { DocumentResponseDto } from '@/domain/course-catalog/application/dtos/document-response.dto';

vi.mock(
  '@/domain/course-catalog/application/use-cases/create-document.use-case',
);
vi.mock(
  '@/domain/course-catalog/application/use-cases/list-documents.use-case',
);
vi.mock('@/domain/course-catalog/application/use-cases/get-document.use-case');
vi.mock(
  '@/domain/course-catalog/application/use-cases/delete-document.use-case',
);
vi.mock(
  '@/domain/course-catalog/application/use-cases/update-document.use-case',
);

describe('DocumentController', () => {
  let controller: DocumentController;
  let createUc: CreateDocumentUseCase;
  let listUc: ListDocumentsUseCase;
  let getUc: GetDocumentUseCase;
  let deleteUc: DeleteDocumentUseCase;
  let updateUc: UpdateDocumentUseCase;

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

  const mockUpdatedDocument = {
    ...mockDocument,
    filename: 'updated-document.pdf',
    fileSize: 2048,
    isDownloadable: false,
    updatedAt: new Date(),
    toResponseObject: vi.fn().mockReturnValue({
      id: documentId,
      filename: 'updated-document.pdf',
      fileSize: 2048,
      fileSizeInMB: 0.002,
      mimeType: 'application/pdf',
      isDownloadable: false,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    touch: vi.fn(),
    updateDetails: vi.fn(),
    incrementDownloadCount: vi.fn(),
    _id: documentId,
    props: {},
    equals: vi.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    createUc = new CreateDocumentUseCase({} as any, {} as any);
    listUc = new ListDocumentsUseCase({} as any, {} as any);
    getUc = new GetDocumentUseCase({} as any, {} as any);
    deleteUc = new DeleteDocumentUseCase({} as any);
    updateUc = new UpdateDocumentUseCase({} as any);

    controller = new DocumentController(
      createUc,
      listUc,
      getUc,
      deleteUc,
      updateUc,
    );
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

  describe('delete()', () => {
    it('returns success message when deletion is successful', async () => {
      const mockDeleteResponse = {
        message: 'Document deleted successfully',
        deletedAt: new Date(),
      };
      vi.mocked(deleteUc.execute).mockResolvedValueOnce(
        right(mockDeleteResponse),
      );
      const result = await controller.delete(lessonId, documentId);
      expect(deleteUc.execute).toHaveBeenCalledWith({
        id: documentId,
        lessonId,
      });
      expect(result).toEqual(mockDeleteResponse);
    });

    it('throws NotFoundException on DocumentNotFoundError', async () => {
      vi.mocked(deleteUc.execute).mockResolvedValueOnce(
        left(new DocumentNotFoundError()),
      );
      await expect(
        controller.delete(lessonId, documentId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      vi.mocked(deleteUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('Invalid document ID', [])),
      );
      await expect(
        controller.delete(lessonId, documentId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      vi.mocked(deleteUc.execute).mockResolvedValueOnce(
        left(new RepositoryError('Database error')),
      );
      await expect(
        controller.delete(lessonId, documentId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws ConflictException on DocumentHasDependenciesError', async () => {
      const mockDependencyInfo = {
        canDelete: false,
        totalDependencies: 1,
        summary: { downloads: 1, translations: 0 },
        dependencies: [
          {
            type: 'download' as const,
            id: 'download-1',
            name: 'Downloaded by User',
            relatedEntities: {
              userId: 'u1',
              userName: 'User',
              downloadedAt: new Date(),
            },
          },
        ],
      };
      const depError = new DocumentHasDependenciesError(
        ['Downloaded by User'],
        mockDependencyInfo,
      );
      (depError as any).dependencyInfo = mockDependencyInfo;
      vi.mocked(deleteUc.execute).mockResolvedValueOnce(left(depError));
      await expect(
        controller.delete(lessonId, documentId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update()', () => {
    const updateBody: Omit<UpdateDocumentRequest, 'id' | 'lessonId'> = {
      filename: 'updated-document.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      isDownloadable: false,
      translations: [
        {
          locale: 'pt',
          title: 'Documento Atualizado',
          description: 'Descrição atualizada',
          url: 'http://example.com/updated-doc.pdf',
        },
      ],
    };

    const mockTranslations = [
      {
        locale: 'pt' as const,
        title: 'Documento Atualizado',
        description: 'Descrição atualizada',
        url: 'http://example.com/updated-doc.pdf',
      },
    ];

    it('returns updated document when successful', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        right({
          document: mockUpdatedDocument as any,
          translations: mockTranslations,
        }),
      );

      const result = await controller.update(lessonId, documentId, updateBody);

      expect(updateUc.execute).toHaveBeenCalledWith({
        ...updateBody,
        id: documentId,
      });
      expect(result).toEqual({
        document: {
          id: documentId,
          url: 'http://example.com/updated-doc.pdf',
          filename: 'updated-document.pdf',
          title: 'Documento Atualizado',
          fileSize: 2048,
          fileSizeInMB: 0.002,
          mimeType: 'application/pdf',
          isDownloadable: false,
          downloadCount: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        translations: [
          {
            locale: 'pt',
            title: 'Documento Atualizado',
            description: 'Descrição atualizada',
          },
        ],
      });
    });

    it('handles empty translations array', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        right({
          document: mockUpdatedDocument as any,
          translations: [],
        }),
      );

      const result = await controller.update(lessonId, documentId, updateBody);

      expect(result).toEqual({
        document: {
          id: documentId,
          url: '',
          filename: 'updated-document.pdf',
          title: 'updated-document.pdf',
          fileSize: 2048,
          fileSizeInMB: 0.002,
          mimeType: 'application/pdf',
          isDownloadable: false,
          downloadCount: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        translations: [],
      });
    });

    it('throws BadRequestException on InvalidInputError', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('Invalid filename', [])),
      );

      await expect(
        controller.update(lessonId, documentId, updateBody),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException with details on InvalidInputError', async () => {
      const details = ['filename must be a string'];
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        left(new InvalidInputError('Invalid input', details)),
      );

      try {
        await controller.update(lessonId, documentId, updateBody);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          message: 'Invalid input',
          details: details,
        });
      }
    });

    it('throws NotFoundException on DocumentNotFoundError', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        left(new DocumentNotFoundError()),
      );

      await expect(
        controller.update(lessonId, documentId, updateBody),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      await expect(
        controller.update(lessonId, documentId, updateBody),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on unknown error', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        left(new Error('Unknown error')),
      );

      await expect(
        controller.update(lessonId, documentId, updateBody),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('calls update use case with correct parameters', async () => {
      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        right({
          document: mockUpdatedDocument as any,
          translations: mockTranslations,
        }),
      );

      await controller.update(lessonId, documentId, updateBody);

      expect(updateUc.execute).toHaveBeenCalledWith({
        id: documentId,
        filename: 'updated-document.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        isDownloadable: false,
        translations: [
          {
            locale: 'pt',
            title: 'Documento Atualizado',
            description: 'Descrição atualizada',
            url: 'http://example.com/updated-doc.pdf',
          },
        ],
      });
    });

    it('handles partial updates correctly', async () => {
      const partialUpdateBody = {
        filename: 'partial-update.pdf',
        isDownloadable: true,
      };

      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        right({
          document: mockUpdatedDocument as any,
          translations: mockTranslations,
        }),
      );

      await controller.update(lessonId, documentId, partialUpdateBody);

      expect(updateUc.execute).toHaveBeenCalledWith({
        id: documentId,
        filename: 'partial-update.pdf',
        isDownloadable: true,
      });
    });
  });
});
