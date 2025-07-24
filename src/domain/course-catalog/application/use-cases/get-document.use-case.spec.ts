// src/domain/course-catalog/application/use-cases/get-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetDocumentUseCase } from './get-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Document, DocumentTranslationProps } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { right, left, Either } from '@/core/either';
import { GetDocumentRequest } from '../dtos/get-document-request.dto';
import { GetDocumentUseCaseResponse } from './get-document.use-case';

// Helper function to create a valid request
function createValidRequest(overrides?: Partial<GetDocumentRequest>): GetDocumentRequest {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    documentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ...overrides,
  };
}

// Helper function to create a test lesson
function createTestLesson(id: string = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'): Lesson {
  return Lesson.create(
    {
      slug: 'lesson-test',
      moduleId: 'mod-1',
      translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
      flashcardIds: [],
      assessments: [],
      commentIds: [],
      order: 0,
    },
    new UniqueEntityID(id),
  );
}

// Helper function to create document translations
function createDocumentTranslations(prefix: string = 'Doc'): DocumentTranslationProps[] {
  return [
    {
      locale: 'pt',
      title: `${prefix} PT`,
      description: `Desc ${prefix} PT`,
      url: `/${prefix.toLowerCase()}-pt.pdf`,
    },
    {
      locale: 'it',
      title: `${prefix} IT`,
      description: `Desc ${prefix} IT`,
      url: `/${prefix.toLowerCase()}-it.pdf`,
    },
    {
      locale: 'es',
      title: `${prefix} ES`,
      description: `Desc ${prefix} ES`,
      url: `/${prefix.toLowerCase()}-es.pdf`,
    },
  ];
}

describe('GetDocumentUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let documentRepo: InMemoryDocumentRepository;
  let sut: GetDocumentUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    documentRepo = new InMemoryDocumentRepository();
    sut = new GetDocumentUseCase(lessonRepo as any, documentRepo as any);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should get document successfully when it exists and belongs to the lesson', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations = createDocumentTranslations();
      const document = Document.create(
        {
          filename: 'doc.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const doc = result.value.document;
        expect(doc.id).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
        expect(doc.filename).toBe('doc.pdf');
        expect(doc.createdAt).toBeInstanceOf(Date);
        expect(doc.updatedAt).toBeInstanceOf(Date);
        expect(doc.translations).toHaveLength(3);
        expect(doc.translations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              locale: 'pt',
              title: 'Doc PT',
              url: '/doc-pt.pdf',
            }),
            expect.objectContaining({
              locale: 'it',
              title: 'Doc IT',
              url: '/doc-it.pdf',
            }),
            expect.objectContaining({
              locale: 'es',
              title: 'Doc ES',
              url: '/doc-es.pdf',
            }),
          ]),
        );
      }
    });

    it('should return document with all translation details', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Título em Português',
          description: 'Descrição detalhada em português',
          url: 'https://example.com/doc-pt.pdf',
        },
        {
          locale: 'it',
          title: 'Titolo in Italiano',
          description: 'Descrizione dettagliata in italiano',
          url: 'https://example.com/doc-it.pdf',
        },
        {
          locale: 'es',
          title: 'Título en Español',
          description: 'Descripción detallada en español',
          url: 'https://example.com/doc-es.pdf',
        },
      ];

      const document = Document.create(
        {
          filename: 'detailed.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const doc = result.value.document;
        doc.translations.forEach((trans, index) => {
          expect(trans.locale).toBe(translations[index].locale);
          expect(trans.title).toBe(translations[index].title);
          expect(trans.description).toBe(translations[index].description);
          expect(trans.url).toBe(translations[index].url);
        });
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid lesson UUID', async () => {
      // Arrange
      const request = createValidRequest({ lessonId: 'bad' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        expect(result.value.details).toEqual(
          expect.arrayContaining([expect.objectContaining({ path: ['lessonId'] })]),
        );
      }
    });

    it('should return InvalidInputError for invalid document UUID', async () => {
      // Arrange
      const request = createValidRequest({ documentId: 'bad' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        expect(result.value.details).toEqual(
          expect.arrayContaining([expect.objectContaining({ path: ['documentId'] })]),
        );
      }
    });

    it('should return InvalidInputError for empty UUIDs', async () => {
      // Arrange
      const request: any = { lessonId: '', documentId: '' };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for missing parameters', async () => {
      // Arrange
      const request: any = {};

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  // Business Rule Errors
  describe('Business Rule Errors', () => {
    it('should return LessonNotFoundError when lesson does not exist', async () => {
      // Arrange
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });

    it('should return DocumentNotFoundError when document does not exist', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DocumentNotFoundError);
    });

    it('should return DocumentNotFoundError when document belongs to another lesson', async () => {
      // Arrange
      const lesson1 = createTestLesson('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const lesson2 = createTestLesson('cccccccc-cccc-cccc-cccc-cccccccccccc');
      await lessonRepo.create(lesson1);
      await lessonRepo.create(lesson2);

      // Create document under lesson2
      const translations = createDocumentTranslations();
      const document = Document.create(
        {
          filename: 'other.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );
      await documentRepo.create(lesson2.id.toString(), document, translations);

      // Try to fetch from lesson1
      const request = createValidRequest({ lessonId: lesson1.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DocumentNotFoundError);
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when document repository fails', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(documentRepo, 'findById').mockResolvedValueOnce(
        left(new Error('DB fail')),
      );

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('DB fail');
      }
    });

    it('should return LessonNotFoundError when lesson repository returns left', async () => {
      // Arrange
      vi.spyOn(lessonRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Not found')),
      );

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });

    it('should handle unexpected errors from repositories', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(documentRepo, 'findById').mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      const request = createValidRequest();

      // Act & Assert
      await expect(sut.execute(request)).rejects.toThrow('Unexpected error');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle document with minimal translations', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'T',
          description: 'D',
          url: '/f.pdf',
        },
      ];

      const document = Document.create(
        {
          filename: 'minimal.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.translations).toHaveLength(1);
        expect(result.value.document.translations[0].title).toBe('T');
      }
    });

    it('should handle document with file paths as URLs', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations: DocumentTranslationProps[] = [
        {
          locale: 'pt',
          title: 'Local File',
          description: 'Local file document',
          url: '/documents/local/file.pdf',
        },
        {
          locale: 'it',
          title: 'File Locale',
          description: 'Documento file locale',
          url: '/documenti/locale/file.pdf',
        },
        {
          locale: 'es',
          title: 'Archivo Local',
          description: 'Documento archivo local',
          url: '/documentos/local/archivo.pdf',
        },
      ];

      const document = Document.create(
        {
          filename: 'local-paths.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        result.value.document.translations.forEach(trans => {
          expect(trans.url).toMatch(/^\/[a-z]+\/[a-z]+\/[a-z]+\.pdf$/);
        });
      }
    });

    it('should preserve document metadata exactly as stored', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations = createDocumentTranslations();
      const document = Document.create(
        {
          filename: 'exact-match.pdf',
          translations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );

      const originalCreatedAt = document.createdAt;
      const originalUpdatedAt = document.updatedAt;

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const doc = result.value.document;
        expect(doc.id).toBe(document.id.toString());
        expect(doc.filename).toBe(document.filename);
        expect(doc.createdAt).toEqual(originalCreatedAt);
        expect(doc.updatedAt).toEqual(originalUpdatedAt);
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should retrieve document efficiently', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      // Create many documents in the lesson
      for (let i = 0; i < 100; i++) {
        const translations = createDocumentTranslations(`Doc${i}`);
        const doc = Document.create({
          filename: `doc-${i}.pdf`,
          translations,
        });
        await documentRepo.create(lesson.id.toString(), doc, translations);
      }

      // Create the target document
      const targetTranslations = createDocumentTranslations('Target');
      const targetDocument = Document.create(
        {
          filename: 'target.pdf',
          translations: targetTranslations,
        },
        new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
      );
      await documentRepo.create(lesson.id.toString(), targetDocument, targetTranslations);

      const request = createValidRequest();
      const start = Date.now();

      // Act
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should enforce document belongs to specified lesson', async () => {
      // Arrange
      const lesson1 = createTestLesson('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const lesson2 = createTestLesson('cccccccc-cccc-cccc-cccc-cccccccccccc');
      await lessonRepo.create(lesson1);
      await lessonRepo.create(lesson2);

      // Create documents in both lessons
      const translations1 = createDocumentTranslations('Lesson1');
      const doc1 = Document.create(
        {
          filename: 'lesson1-doc.pdf',
          translations: translations1,
        },
        new UniqueEntityID('11111111-1111-1111-1111-111111111111'),
      );
      await documentRepo.create(lesson1.id.toString(), doc1, translations1);

      const translations2 = createDocumentTranslations('Lesson2');
      const doc2 = Document.create(
        {
          filename: 'lesson2-doc.pdf',
          translations: translations2,
        },
        new UniqueEntityID('22222222-2222-2222-2222-222222222222'),
      );
      await documentRepo.create(lesson2.id.toString(), doc2, translations2);

      // Try to access lesson1's document
      const request1 = createValidRequest({
        lessonId: lesson1.id.toString(),
        documentId: doc1.id.toString(),
      });
      const result1 = await sut.execute(request1);

      // Try to access lesson2's document from lesson1
      const request2 = createValidRequest({
        lessonId: lesson1.id.toString(),
        documentId: doc2.id.toString(),
      });
      const result2 = await sut.execute(request2);

      // Assert
      expect(result1.isRight()).toBe(true);
      expect(result2.isLeft()).toBe(true);
      if (result2.isLeft()) {
        expect(result2.value).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    it('should validate both lesson and document existence before retrieval', async () => {
      // Arrange - no data setup

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert - should fail with lesson not found first
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });
  });
});