// src/domain/course-catalog/application/use-cases/update-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/update-document.use-case';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { UpdateDocumentRequest } from '@/domain/course-catalog/application/dtos/update-document-request.dto';
import { Document, DocumentTranslationProps } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right, Either } from '@/core/either';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

// Helper function to create a valid document
function createValidDocument(id?: string): Document {
  const documentId = id || new UniqueEntityID().toString();

  return Document.create(
    {
      filename: 'test-document.pdf',
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

// Helper function to create a valid update request
function createValidUpdateRequest(overrides?: Partial<UpdateDocumentRequest>): UpdateDocumentRequest {
  return {
    id: new UniqueEntityID().toString(),
    filename: 'updated-document.pdf',
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
    ...overrides,
  };
}

describe('UpdateDocumentUseCase', () => {
  let repo: InMemoryDocumentRepository;
  let sut: UpdateDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryDocumentRepository();
    sut = new UpdateDocumentUseCase(repo);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should update a document successfully when it exists', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request = createValidUpdateRequest({ id: document.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe('updated-document.pdf');
        expect(result.value.translations).toHaveLength(2);
        expect(result.value.translations[0].title).toBe('Documento Atualizado');
        expect(result.value.translations[1].title).toBe('Documento Aggiornato');
      }
    });

    it('should update only filename when only filename is provided', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        filename: 'only-filename-updated.pdf',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe('only-filename-updated.pdf');
        expect(result.value.translations).toEqual(initialTranslations);
      }
    });

    it('should update only translations when only translations are provided', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const originalFilename = document.filename;
      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Apenas Traduções Atualizadas',
            description: 'Nova descrição',
            url: 'http://example.com/new-pt.pdf',
          },
        ],
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe(originalFilename);
        expect(result.value.translations).toHaveLength(1);
        expect(result.value.translations[0].title).toBe('Apenas Traduções Atualizadas');
      }
    });

    it('should accept file paths in URL field', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Documento com Caminho',
            description: 'Usando caminho de arquivo',
            url: '/documents/local-file.pdf',
          },
        ],
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.translations[0].url).toBe('/documents/local-file.pdf');
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty document ID', async () => {
      // Arrange
      const request: any = { id: '' };

      // Act
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

    it('should return InvalidInputError for invalid UUID format', async () => {
      // Arrange
      const request: any = { id: 'invalid-uuid' };

      // Act
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


    it('should return InvalidInputError for invalid locale in translations', async () => {
      // Arrange
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

      // Act
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

    it('should return InvalidInputError for translations without Portuguese', async () => {
      // Arrange
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

      // Act
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

    it('should return InvalidInputError for duplicate locales in translations', async () => {
      // Arrange
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

      // Act
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

    it('should return InvalidInputError for invalid URL format', async () => {
      // Arrange
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

      // Act
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

  // Business Rule Errors
  describe('Business Rule Errors', () => {
    it('should return DocumentNotFoundError when document does not exist', async () => {
      // Arrange
      const nonExistentId = new UniqueEntityID().toString();
      const request = createValidUpdateRequest({ id: nonExistentId });

      // Act
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });

    it('should return RepositoryError when finding document fails', async () => {
      // Arrange
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = createValidUpdateRequest({ id: documentId });

      // Act
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('should handle Left result from repository.findById', async () => {
      // Arrange
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Document lookup failed')),
      );

      const request = createValidUpdateRequest({ id: documentId });

      // Act
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when update fails', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      vi.spyOn(repo, 'update').mockResolvedValueOnce(
        left(new Error('Update failed')),
      );

      const request = createValidUpdateRequest({ id: document.id.toString() });

      // Act
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Update failed');
      }
    });

    it('should handle exception thrown during update', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      vi.spyOn(repo, 'update').mockImplementationOnce(() => {
        throw new Error('Unexpected update error');
      });

      const request = createValidUpdateRequest({ id: document.id.toString() });

      // Act
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected update error');
      }
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle document with multiple translations update', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/pt.pdf',
        },
        {
          locale: 'it',
          title: 'Documento IT',
          description: 'Descrizione IT',
          url: 'http://example.com/it.pdf',
        },
        {
          locale: 'es',
          title: 'Documento ES',
          description: 'Descripción ES',
          url: 'http://example.com/es.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        translations: [
          {
            locale: 'pt',
            title: 'Documento PT Atualizado',
            description: 'Nova descrição PT',
            url: '/documents/pt-updated.pdf',
          },
        ],
      };

      // Act
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

    it('should handle update with no changes', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        // No fields to update
      };

      // Act
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Document should remain unchanged
        expect(result.value.document.filename).toBe(document.filename);
        expect(result.value.translations).toEqual(initialTranslations);
      }
    });

    it('should verify updatedAt timestamp is updated', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);

      const originalUpdatedAt = document.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const request: UpdateDocumentRequest = {
        id: document.id.toString(),
        filename: 'new-filename.pdf',
      };

      // Act
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle multiple concurrent document updates efficiently', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const promises: Promise<Either<
        InvalidInputError | DocumentNotFoundError | RepositoryError | Error,
        {
          document: Document;
          translations: Array<{
            locale: 'pt' | 'it' | 'es';
            title: string;
            description: string;
            url: string;
          }>;
        }
      >>[] = [];
      
      // Create multiple documents
      for (let i = 0; i < 10; i++) {
        const document = createValidDocument();
        const translations: DocumentTranslationProps[] = [
          {
            locale: 'pt',
            title: `Documento ${i}`,
            description: `Descrição ${i}`,
            url: `http://example.com/doc-${i}.pdf`,
          },
        ];
        await repo.create(lessonId, document, translations);
        
        const request = createValidUpdateRequest({ 
          id: document.id.toString(),
          filename: `updated-${i}.pdf` 
        });
        promises.push(sut.execute(request));
      }

      const start = Date.now();
      
      // Act
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      // Assert
      results.forEach(result => {
        expect(result.isRight()).toBe(true);
      });
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should maintain document integrity during updates', async () => {
      // Arrange
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const initialTranslations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Documento Original',
          description: 'Descrição original',
          url: 'http://example.com/original-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, initialTranslations);
      
      const documentId = document.id.toString();
      const request = createValidUpdateRequest({
        id: documentId,
        filename: 'integrity-test.pdf',
      });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // ID should remain unchanged
        expect(result.value.document.id.toString()).toBe(documentId);
        // Created date should remain unchanged
        expect(result.value.document.createdAt).toEqual(document.createdAt);
      }
    });

    it('should require valid document existence before update', async () => {
      // Arrange
      const request = createValidUpdateRequest({
        id: new UniqueEntityID().toString(),
      });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('should validate all input data before processing', async () => {
      // Arrange
      const request: any = {
        id: 'not-a-uuid',
        filename: '',
        translations: [
          {
            locale: 'invalid',
            title: '',
            description: '',
            url: 'not-a-url',
          },
        ],
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });
});
