// src/domain/course-catalog/application/use-cases/update-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/update-document.use-case';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { UpdateDocumentRequest } from '@/domain/course-catalog/application/dtos/update-document-request.dto';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';

let repo: InMemoryDocumentRepository;
let sut: UpdateDocumentUseCase;

describe('UpdateDocumentUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryDocumentRepository();
    sut = new UpdateDocumentUseCase(repo);
  });

  function createValidDocument(id?: string): Document {
    const documentId = id || new UniqueEntityID().toString();

    return Document.create(
      {
        filename: 'test-document.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        isDownloadable: true,
        translations: [
          {
            locale: 'pt',
            title: 'Documento de Teste',
            description: 'Descrição do documento',
            url: 'http://example.com/doc-pt.pdf',
          },
        ],
      },
      new UniqueEntityID(documentId),
    );
  }

  function validUpdateRequest(id?: string): UpdateDocumentRequest {
    return {
      id: id || new UniqueEntityID().toString(),
      filename: 'updated-document.pdf',
      fileSize: 2 * 1024 * 1024, // 2MB
      translations: [
        {
          locale: 'pt',
          title: 'Documento Atualizado',
          description: 'Descrição atualizada',
          url: 'http://example.com/updated-doc-pt.pdf',
        },
        {
          locale: 'it',
          title: 'Documento Aggiornato',
          description: 'Descrizione aggiornata',
          url: 'http://example.com/updated-doc-it.pdf',
        },
      ],
    };
  }

  describe('Successful updates', () => {
    it('updates a document successfully when it exists', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = validUpdateRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe('updated-document.pdf');
        expect(result.value.document.fileSize).toBe(2 * 1024 * 1024);
        expect(result.value.translations).toHaveLength(2);
        expect(result.value.translations[0].title).toBe('Documento Atualizado');
        expect(result.value.translations[1].title).toBe('Documento Aggiornato');
      }
    });

    it('updates only filename when only filename is provided', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const originalFileSize = document.fileSize;
      const request = {
        id: document.id.toString(),
        filename: 'only-filename-updated.pdf',
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe(
          'only-filename-updated.pdf',
        );
        expect(result.value.document.fileSize).toBe(originalFileSize); // Should remain unchanged
        expect(result.value.translations).toEqual(initialTranslations); // Should remain unchanged
      }
    });

    it('updates only translations when only translations are provided', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const originalFilename = document.filename;
      const request = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt' as const,
            title: 'Apenas Traduções Atualizadas',
            description: 'Nova descrição',
            url: 'http://example.com/new-pt.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe(originalFilename); // Should remain unchanged
        expect(result.value.translations).toHaveLength(1);
        expect(result.value.translations[0].title).toBe(
          'Apenas Traduções Atualizadas',
        );
      }
    });

    it('updates isDownloadable flag', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = {
        id: document.id.toString(),
        isDownloadable: false,
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.isDownloadable).toBe(false);
      }
    });

    it('accepts file paths in URL field', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt' as const,
            title: 'Documento com Caminho',
            description: 'Usando caminho de arquivo',
            url: '/documents/local-file.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.translations[0].url).toBe(
          '/documents/local-file.pdf',
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty document ID', async () => {
      const request: any = { id: '' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Document ID must be a valid UUID',
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
              message: 'Document ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects file size exceeding limit', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        fileSize: 101 * 1024 * 1024, // 101MB
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'File size cannot exceed 100MB',
              path: ['fileSize'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid locale in translations', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          {
            locale: 'en', // Invalid locale
            title: 'English Title',
            description: 'English description',
            url: 'http://example.com/en.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Locale must be one of: pt, it, es',
              path: ['translations', 0, 'locale'],
            }),
          ]),
        );
      }
    });

    it('rejects translations without Portuguese', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          {
            locale: 'it',
            title: 'Documento Italiano',
            description: 'Descrizione italiana',
            url: 'http://example.com/it.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Portuguese (pt) translation is required',
              path: ['translations'],
            }),
          ]),
        );
      }
    });

    it('rejects duplicate locales in translations', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Primeiro PT',
            description: 'Primeira descrição',
            url: 'http://example.com/pt1.pdf',
          },
          {
            locale: 'pt', // Duplicate
            title: 'Segundo PT',
            description: 'Segunda descrição',
            url: 'http://example.com/pt2.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Each locale can only appear once in translations',
              path: ['translations'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid URL format', async () => {
      const request: any = {
        id: new UniqueEntityID().toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Documento',
            description: 'Descrição',
            url: 'invalid-url-format',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'URL must be a valid URL or file path',
              path: ['translations', 0, 'url'],
            }),
          ]),
        );
      }
    });
  });

  describe('Document not found errors', () => {
    it('returns DocumentNotFoundError when document does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validUpdateRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });

    it('handles repository error when finding document', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validUpdateRequest(documentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Document lookup failed')),
      );

      const request = validUpdateRequest(documentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during update', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      vi.spyOn(repo, 'update').mockResolvedValueOnce(
        left(new Error('Update failed')),
      );

      const request = validUpdateRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Update failed');
      }
    });

    it('handles exception thrown during update', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      vi.spyOn(repo, 'update').mockImplementationOnce(() => {
        throw new Error('Unexpected update error');
      });

      const request = validUpdateRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected update error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles document with multiple translations update', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/pt.pdf',
        },
        {
          locale: 'it' as const,
          title: 'Documento IT',
          description: 'Descrizione IT',
          url: 'http://example.com/it.pdf',
        },
        {
          locale: 'es' as const,
          title: 'Documento ES',
          description: 'Descripción ES',
          url: 'http://example.com/es.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt' as const,
            title: 'Documento PT Atualizado',
            description: 'Nova descrição PT',
            url: '/documents/pt-updated.pdf',
          },
        ],
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.translations).toHaveLength(1);
        expect(result.value.translations[0].title).toBe(
          'Documento PT Atualizado',
        );
        expect(result.value.translations[0].url).toBe(
          '/documents/pt-updated.pdf',
        );
      }
    });

    it('handles update with no changes', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = {
        id: document.id.toString(),
        // No fields to update
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Document should remain unchanged
        expect(result.value.document.filename).toBe(document.filename);
        expect(result.value.translations).toEqual(initialTranslations);
      }
    });

    it('verifies updatedAt timestamp is updated', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations = [
        {
          locale: 'pt' as const,
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const originalUpdatedAt = document.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request = {
        id: document.id.toString(),
        filename: 'new-filename.pdf',
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }
    });
  });
});
