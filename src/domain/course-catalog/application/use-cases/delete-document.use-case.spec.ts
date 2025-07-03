import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteDocumentUseCase } from './delete-document.use-case';
import { IDocumentRepository } from '../repositories/i-document-repository';
import { Document } from '../../enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { right, left } from '@/core/either';
import { InvalidInputError } from './errors/invalid-input-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { DocumentHasDependenciesError } from './errors/document-has-dependencies-error';

describe('DeleteDocumentUseCase', () => {
  let sut: DeleteDocumentUseCase;
  let documentRepository: IDocumentRepository;

  beforeEach(() => {
    documentRepository = {
      findById: vi.fn(),
      delete: vi.fn(),
      findByFilename: vi.fn(),
      create: vi.fn(),
      findByLesson: vi.fn(),
      incrementDownloadCount: vi.fn(),
      checkDocumentDependencies: vi.fn(),
    };

    sut = new DeleteDocumentUseCase(documentRepository);
  });

  describe('Successful deletion', () => {
    it('deletes a document successfully when it exists', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({
          document,
          translations: [
            {
              locale: 'pt' as const,
              title: 'Documento de Teste',
              description: 'Descrição do documento',
              url: 'https://example.com/test.pdf',
            },
          ],
        }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 1 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
      }
      expect(documentRepository.findById).toHaveBeenCalledWith(documentId);
      expect(documentRepository.checkDocumentDependencies).toHaveBeenCalledWith(
        documentId,
      );
      expect(documentRepository.delete).toHaveBeenCalledWith(documentId);
    });

    it('deletes a document with translations successfully', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({
          document,
          translations: [
            {
              locale: 'pt' as const,
              title: 'Documento de Teste',
              description: 'Descrição do documento',
              url: 'https://example.com/test.pdf',
            },
            {
              locale: 'it' as const,
              title: 'Documento di Prova',
              description: 'Descrizione del documento',
              url: 'https://example.com/test.pdf',
            },
          ],
        }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 2 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
      }
    });

    it('deletes a document successfully with lessonId validation', async () => {
      const documentId = new UniqueEntityID().toString();
      const lessonId = new UniqueEntityID().toString();
      const document = Document.create(
        {
          filename: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          isDownloadable: true,
          downloadCount: 0,
          translations: [],
        },
        new UniqueEntityID(documentId),
      );

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(documentRepository, 'findByLesson').mockResolvedValue(
        right([{ document, translations: [] }]),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId, lessonId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
      expect(documentRepository.findByLesson).toHaveBeenCalledWith(lessonId);
    });

    it('returns success message with current timestamp', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const beforeExecution = new Date();
      const result = await sut.execute({ id: documentId });
      const afterExecution = new Date();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.deletedAt.getTime()).toBeGreaterThanOrEqual(
          beforeExecution.getTime(),
        );
        expect(result.value.deletedAt.getTime()).toBeLessThanOrEqual(
          afterExecution.getTime(),
        );
      }
    });
  });

  describe('Cross-lesson validation', () => {
    it('returns DocumentNotFoundError when document does not belong to specified lesson', async () => {
      const documentId = new UniqueEntityID().toString();
      const lessonId = new UniqueEntityID().toString();
      const document = Document.create(
        {
          filename: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          isDownloadable: true,
          downloadCount: 0,
          translations: [],
        },
        new UniqueEntityID(documentId),
      );

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      // Document exists but not in the specified lesson
      vi.spyOn(documentRepository, 'findByLesson').mockResolvedValue(
        right([]), // Empty array means document doesn't belong to this lesson
      );

      const request = { id: documentId, lessonId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('returns DocumentNotFoundError when lesson does not exist', async () => {
      const documentId = new UniqueEntityID().toString();
      const lessonId = new UniqueEntityID().toString();
      const document = Document.create(
        {
          filename: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          isDownloadable: true,
          downloadCount: 0,
          translations: [],
        },
        new UniqueEntityID(documentId),
      );

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      // Lesson doesn't exist
      vi.spyOn(documentRepository, 'findByLesson').mockResolvedValue(
        left(new Error('Lesson not found')),
      );

      const request = { id: documentId, lessonId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('allows deletion when document belongs to specified lesson', async () => {
      const documentId = new UniqueEntityID().toString();
      const lessonId = new UniqueEntityID().toString();
      const document = Document.create(
        {
          filename: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          isDownloadable: true,
          downloadCount: 0,
          translations: [],
        },
        new UniqueEntityID(documentId),
      );

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      // Document belongs to the specified lesson
      vi.spyOn(documentRepository, 'findByLesson').mockResolvedValue(
        right([{ document, translations: [] }]),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId, lessonId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });

    it('does not validate lesson when lessonId is not provided', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(documentRepository.findByLesson).not.toHaveBeenCalled();
    });
  });

  describe('Dependencies validation', () => {
    it('returns DocumentHasDependenciesError when document has real dependencies', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: false,
          totalDependencies: 1,
          summary: { downloads: 1, translations: 0 },
          dependencies: [
            {
              type: 'download' as const,
              id: 'download-1',
              name: 'Downloaded by User 1',
              relatedEntities: {
                userId: 'user-1',
                userName: 'User 1',
                downloadedAt: new Date(),
              },
            },
          ],
        }),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentHasDependenciesError);
      }
    });

    it('allows deletion when document has no dependencies', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(left(new Error('Database error')));

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect((result.value as RepositoryError).message).toBe(
          'Database error',
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty document ID', async () => {
      const request = { id: '' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect((result.value as InvalidInputError).message).toBe(
          'Validation failed',
        );
      }
    });

    it('rejects missing document ID', async () => {
      const request = {} as any;
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('rejects invalid UUID format', async () => {
      const request = { id: 'not-a-uuid' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('rejects non-string document ID', async () => {
      const request = { id: 123 } as any;
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('rejects null document ID', async () => {
      const request = { id: null } as any;
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('rejects invalid lessonId UUID format', async () => {
      const request = {
        id: new UniqueEntityID().toString(),
        lessonId: 'not-a-uuid',
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Document not found errors', () => {
    it('returns DocumentNotFoundError when document does not exist', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        left(new Error('Document not found')),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('handles repository error when finding document', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        left(new Error('Database connection error')),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('handles Left result from repository.findById', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        left(new Error('Some error')),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        left(new Error('Database error during deletion')),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect((result.value as RepositoryError).message).toBe(
          'Database error during deletion',
        );
      }
    });

    it('handles exception thrown during deletion', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockRejectedValue(
        new Error('Unexpected error'),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect((result.value as RepositoryError).message).toBe(
          'Unexpected error',
        );
      }
    });

    it('handles generic exception during document lookup', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(documentRepository, 'findById').mockRejectedValue(
        new Error('Network error'),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect((result.value as RepositoryError).message).toBe('Network error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles document with no translations', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });

    it('handles document with empty dependency arrays', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      const documentId = '00000000-0000-0000-0000-000000000000';
      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        left(new Error('Invalid UUID format')),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('handles multiple documents from same lesson', async () => {
      const documentId = new UniqueEntityID().toString();
      const document = Document.create({
        filename: 'lesson1-doc1.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        translations: [],
      });

      vi.spyOn(documentRepository, 'findById').mockResolvedValue(
        right({ document, translations: [] }),
      );
      vi.spyOn(
        documentRepository,
        'checkDocumentDependencies',
      ).mockResolvedValue(
        right({
          canDelete: true,
          totalDependencies: 0,
          summary: { downloads: 0, translations: 0 },
          dependencies: [],
        }),
      );
      vi.spyOn(documentRepository, 'delete').mockResolvedValue(
        right(undefined),
      );

      const request = { id: documentId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });
  });
});
