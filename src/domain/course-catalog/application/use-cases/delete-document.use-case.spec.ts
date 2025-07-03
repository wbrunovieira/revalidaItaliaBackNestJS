// src/domain/course-catalog/application/use-cases/delete-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteDocumentUseCase } from '@/domain/course-catalog/application/use-cases/delete-document.use-case';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { DeleteDocumentRequest } from '@/domain/course-catalog/application/dtos/delete-document-request.dto';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { DocumentHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/document-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';

let repo: InMemoryDocumentRepository;
let sut: DeleteDocumentUseCase;

describe('DeleteDocumentUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryDocumentRepository();
    sut = new DeleteDocumentUseCase(repo);
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

  function validDeleteRequest(id?: string): DeleteDocumentRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a document successfully when it exists and has no dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);
        expect(repo.items).toHaveLength(0);
      }
    });

    it('returns success message with current timestamp', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);
      const afterDeletion = new Date();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.deletedAt.getTime()).toBeGreaterThanOrEqual(
          beforeDeletion.getTime(),
        );
        expect(result.value.deletedAt.getTime()).toBeLessThanOrEqual(
          afterDeletion.getTime(),
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
              message: 'Document ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects missing document ID', async () => {
      const request: any = {};
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
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

    it('rejects non-string document ID', async () => {
      const request: any = { id: 123 };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects null document ID', async () => {
      const request: any = { id: null };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'null',
              path: ['id'],
            }),
          ]),
        );
      }
    });
  });

  describe('Document not found errors', () => {
    it('returns DocumentNotFoundError when document does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
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

      const request = validDeleteRequest(documentId);
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

      const request = validDeleteRequest(documentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });
  });

  describe('Document dependencies errors', () => {
    it('returns DocumentHasDependenciesError when document has been downloaded by users', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      // Adicionar dependências simuladas (usuários que baixaram o documento)
      repo.addDependenciesToDocument(document.id.toString(), {
        downloads: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            downloadedAt: new Date(),
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Maria Santos',
            downloadedAt: new Date(),
          },
        ],
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentHasDependenciesError;
        expect(error).toBeInstanceOf(DocumentHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete document because it has dependencies',
        );
        expect(error.message).toContain('Downloaded by João Silva');
        expect(error.message).toContain('Downloaded by Maria Santos');
      }
    });

    it('returns DocumentHasDependenciesError when document has translations', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      // Adicionar traduções como dependências
      repo.addDependenciesToDocument(document.id.toString(), {
        translations: [
          { id: '1', locale: 'pt', title: 'Documento Introdutório' },
          { id: '2', locale: 'en', title: 'Introduction Document' },
        ],
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentHasDependenciesError;
        expect(error).toBeInstanceOf(DocumentHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete document because it has dependencies',
        );
        expect(error.message).toContain('Translation (pt): Documento Introdutório');
        expect(error.message).toContain('Translation (en): Introduction Document');
      }
    });

    it('returns DocumentHasDependenciesError when document has multiple types of dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      repo.addDependenciesToDocument(document.id.toString(), {
        downloads: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            downloadedAt: new Date(),
          },
        ],
        translations: [{ id: '2', locale: 'pt', title: 'Documento Avançado' }],
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentHasDependenciesError;
        expect(error).toBeInstanceOf(DocumentHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete document because it has dependencies',
        );
        expect(error.message).toContain('Downloaded by João Silva');
        expect(error.message).toContain('Translation (pt): Documento Avançado');
      }
    });

    it('includes dependency info in error for frontend usage', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      repo.addDependenciesToDocument(document.id.toString(), {
        downloads: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            downloadedAt: new Date(),
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Maria Santos',
            downloadedAt: new Date(),
          },
        ],
        translations: [{ id: '3', locale: 'pt', title: 'Teste Documento' }],
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentHasDependenciesError;
        expect(error).toBeInstanceOf(DocumentHasDependenciesError);

        // Verificar se a informação extra está disponível
        const errorWithInfo = error as any;
        expect(errorWithInfo.dependencyInfo).toBeDefined();
        expect(errorWithInfo.dependencyInfo.canDelete).toBe(false);
        expect(errorWithInfo.dependencyInfo.totalDependencies).toBe(3);
        expect(errorWithInfo.dependencyInfo.summary.downloads).toBe(2);
        expect(errorWithInfo.dependencyInfo.summary.translations).toBe(1);

        // Verificar detalhes das entidades relacionadas
        const downloadDeps = errorWithInfo.dependencyInfo.dependencies.filter(
          (d: any) => d.type === 'download',
        );
        expect(downloadDeps).toHaveLength(2);
        expect(downloadDeps[0].relatedEntities?.userName).toBe('João Silva');
        expect(downloadDeps[1].relatedEntities?.userName).toBe('Maria Santos');
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      vi.spyOn(repo, 'checkDocumentDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Dependencies check failed');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during document lookup', async () => {
      const documentId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(documentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected lookup error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles document with no dependencies', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });

    it('handles document with empty dependency arrays', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      repo.addDependenciesToDocument(document.id.toString(), {
        downloads: [],
        translations: [],
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Document deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as DocumentNotFoundError;
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        expect(error.message).toBe('Document not found');
      }
    });

    it('handles exception during dependencies check', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      vi.spyOn(repo, 'checkDocumentDependencies').mockImplementationOnce(() => {
        throw new Error('Unexpected dependencies check error');
      });

      const request = validDeleteRequest(document.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected dependencies check error');
      }
    });

    it('verifies dependency information structure', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document = createValidDocument();
      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];
      await repo.create(lessonId, document, translations);

      repo.addDependenciesToDocument(document.id.toString(), {
        downloads: [
          {
            id: '1',
            userId: 'user1',
            userName: 'João Silva',
            downloadedAt: new Date(),
          },
        ],
        translations: [
          { id: '2', locale: 'pt', title: 'Documento Teste' },
          { id: '3', locale: 'en', title: 'Test Document' },
        ],
      });

      // Testar o método checkDocumentDependencies diretamente
      const dependenciesResult = await repo.checkDocumentDependencies(
        document.id.toString(),
      );

      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(3);
        expect(info.summary.downloads).toBe(1);
        expect(info.summary.translations).toBe(2);
        expect(info.dependencies).toHaveLength(3);

        const downloadDependency = info.dependencies.find(
          (d) => d.type === 'download',
        );
        expect(downloadDependency).toBeDefined();
        expect(downloadDependency?.name).toBe('Downloaded by João Silva');
        expect(downloadDependency?.relatedEntities?.userId).toBe('user1');

        const translationDeps = info.dependencies.filter(
          (d) => d.type === 'translation',
        );
        expect(translationDeps).toHaveLength(2);
      }
    });

    it('handles multiple documents from same lesson', async () => {
      const lessonId = new UniqueEntityID().toString();
      const document1 = createValidDocument();
      const document2 = createValidDocument();
      const document3 = createValidDocument();

      const translations = [
        {
          locale: 'pt' as const,
          title: 'Documento PT',
          description: 'Descrição PT',
          url: 'http://example.com/doc-pt.pdf',
        },
      ];

      await repo.create(lessonId, document1, translations);
      await repo.create(lessonId, document2, translations);
      await repo.create(lessonId, document3, translations);

      // Deletar apenas o documento 2
      const request = validDeleteRequest(document2.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(2);

      // Verificar que os outros documentos ainda existem
      const remainingDocuments = await repo.findByLesson(lessonId);
      expect(remainingDocuments.isRight()).toBe(true);
      if (remainingDocuments.isRight()) {
        expect(remainingDocuments.value).toHaveLength(2);
        const remainingIds = remainingDocuments.value.map((d) =>
          d.document.id.toString(),
        );
        expect(remainingIds).toContain(document1.id.toString());
        expect(remainingIds).toContain(document3.id.toString());
        expect(remainingIds).not.toContain(document2.id.toString());
      }
    });
  });
});