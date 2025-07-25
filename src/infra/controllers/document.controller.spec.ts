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
import {
  DuplicateDocumentError,
  InvalidFileError,
  RepositoryError,
} from '@/domain/course-catalog/domain/exceptions';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { DocumentHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/document-has-dependencies-error';
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
      filename: 'document.pdf',
      translations: [
        {
          locale: 'pt',
          title: 'Test Document',
          description: 'A test document',
          url: 'http://example.com/doc.pdf',
        },
      ],
    };

    it('returns created document payload when successful', async () => {
      const mockCreateResponse = {
        document: {
          id: documentId,
          filename: 'document.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        translations: [
          {
            locale: 'pt' as const,
            title: 'Test Document',
            description: 'A test document',
            url: 'http://example.com/doc.pdf',
          },
        ],
      };

      vi.mocked(createUc.execute).mockResolvedValueOnce(
        right(mockCreateResponse),
      );

      const result = await controller.create(lessonId, body);

      expect(createUc.execute).toHaveBeenCalledWith({ ...body, lessonId });
      expect(result).toEqual({
        id: documentId,
        filename: 'document.pdf',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        translations: [
          {
            locale: 'pt',
            title: 'Test Document',
            description: 'A test document',
            url: 'http://example.com/doc.pdf',
          },
        ],
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
        left(new DuplicateDocumentError('document.pdf')),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      vi.mocked(createUc.execute).mockResolvedValueOnce(
        left(new RepositoryError('database error')),
      );
      await expect(controller.create(lessonId, body)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('handles creation with multiple translations', async () => {
      const bodyWithMultipleTranslations = {
        filename: 'multi-lang.pdf',
        translations: [
          {
            locale: 'pt' as const,
            title: 'Documento Português',
            description: 'Descrição em português',
            url: 'http://example.com/pt-doc.pdf',
          },
          {
            locale: 'it' as const,
            title: 'Documento Italiano',
            description: 'Descrizione in italiano',
            url: 'http://example.com/it-doc.pdf',
          },
          {
            locale: 'es' as const,
            title: 'Documento Español',
            description: 'Descripción en español',
            url: 'http://example.com/es-doc.pdf',
          },
        ],
      };

      const mockMultiResponse = {
        document: {
          id: documentId,
          filename: 'multi-lang.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        translations: [
          { locale: 'pt' as const, title: 'Documento Português', description: 'Descrição em português', url: 'http://example.com/pt-doc.pdf' },
          { locale: 'it' as const, title: 'Documento Italiano', description: 'Descrizione in italiano', url: 'http://example.com/it-doc.pdf' },
          { locale: 'es' as const, title: 'Documento Español', description: 'Descripción en español', url: 'http://example.com/es-doc.pdf' },
        ],
      };

      vi.mocked(createUc.execute).mockResolvedValueOnce(
        right(mockMultiResponse),
      );

      const result = await controller.create(lessonId, bodyWithMultipleTranslations);

      expect(createUc.execute).toHaveBeenCalledWith({ 
        ...bodyWithMultipleTranslations, 
        lessonId 
      });
      expect(result).toEqual({
        id: documentId,
        filename: 'multi-lang.pdf',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        translations: [
          { locale: 'pt', title: 'Documento Português', description: 'Descrição em português', url: 'http://example.com/pt-doc.pdf' },
          { locale: 'it', title: 'Documento Italiano', description: 'Descrizione in italiano', url: 'http://example.com/it-doc.pdf' },
          { locale: 'es', title: 'Documento Español', description: 'Descripción en español', url: 'http://example.com/es-doc.pdf' },
        ],
      });
      expect(result.translations).toHaveLength(3);
      expect(result.translations[0].locale).toBe('pt');
      expect(result.translations[1].locale).toBe('it');
      expect(result.translations[2].locale).toBe('es');
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

    it('throws InternalServerErrorException on RepositoryError', async () => {
      vi.mocked(listUc.execute).mockResolvedValueOnce(
        left(new RepositoryError('database error')),
      );
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
    const updateBody: Omit<UpdateDocumentRequest, 'id'> = {
      filename: 'updated-document.pdf',
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
        id: documentId,
        ...updateBody,
      });
      expect(result).toEqual({
        document: {
          id: documentId,
          filename: 'updated-document.pdf',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
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
          filename: 'updated-document.pdf',
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
        left(new RepositoryError('Unknown error')),
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
      });
    });

    it('handles updates with no translations', async () => {
      const updateBodyNoTranslations = {
        filename: 'no-translations.pdf',
      };

      vi.mocked(updateUc.execute).mockResolvedValueOnce(
        right({
          document: mockUpdatedDocument as any,
          translations: [],
        }),
      );

      const result = await controller.update(lessonId, documentId, updateBodyNoTranslations);

      expect(result.translations).toEqual([]);
      expect(result.document.filename).toBe('updated-document.pdf');
    });
  });

  describe('incrementDownload()', () => {
    it('returns success message with documentId', async () => {
      const result = await controller.incrementDownload(lessonId, documentId);
      
      expect(result).toEqual({
        message: 'Download count incremented successfully',
        documentId: documentId,
      });
    });

    it('handles different documentId formats', async () => {
      const customDocId = 'custom-doc-uuid';
      const result = await controller.incrementDownload(lessonId, customDocId);
      
      expect(result).toEqual({
        message: 'Download count incremented successfully', 
        documentId: customDocId,
      });
    });
  });
});
