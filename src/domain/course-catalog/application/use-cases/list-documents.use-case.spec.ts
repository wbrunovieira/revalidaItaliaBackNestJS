// src/domain/course-catalog/application/use-cases/list-documents.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListDocumentsUseCase } from './list-documents.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import {
  Document,
  DocumentTranslationProps,
} from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { right, left, Either } from '@/core/either';
import { ListDocumentsRequest } from '../dtos/list-documents-request.dto';
import { ListDocumentsUseCaseResponse } from './list-documents.use-case';

// Helper function to create a valid request
function createValidRequest(
  overrides?: Partial<ListDocumentsRequest>,
): ListDocumentsRequest {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ...overrides,
  };
}

// Helper function to create a test lesson
function createTestLesson(
  id: string = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
): Lesson {
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
function createDocumentTranslations(
  prefix: string,
): DocumentTranslationProps[] {
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

describe('ListDocumentsUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let documentRepo: InMemoryDocumentRepository;
  let sut: ListDocumentsUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    documentRepo = new InMemoryDocumentRepository();
    sut = new ListDocumentsUseCase(lessonRepo as any, documentRepo as any);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should list documents successfully when lesson has documents', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations1 = createDocumentTranslations('Documento 1');
      const translations2 = createDocumentTranslations('Documento 2');

      const document1 = Document.create({
        filename: 'doc1.pdf',
        translations: translations1,
      });
      const document2 = Document.create({
        filename: 'doc2.docx',
        translations: translations2,
      });

      await documentRepo.create(lesson.id.toString(), document1, translations1);
      await documentRepo.create(lesson.id.toString(), document2, translations2);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const docs = result.value.documents;
        expect(docs).toHaveLength(2);

        const doc1 = docs.find((d) => d.filename === 'doc1.pdf');
        expect(doc1).toBeDefined();
        expect(doc1!.filename).toBe('doc1.pdf');
        expect(doc1!.createdAt).toBeInstanceOf(Date);
        expect(doc1!.updatedAt).toBeInstanceOf(Date);
        expect(doc1!.translations).toHaveLength(3);
        expect(doc1!.translations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ locale: 'pt', title: 'Documento 1 PT' }),
            expect.objectContaining({ locale: 'it', title: 'Documento 1 IT' }),
            expect.objectContaining({ locale: 'es', title: 'Documento 1 ES' }),
          ]),
        );

        const doc2 = docs.find((d) => d.filename === 'doc2.docx');
        expect(doc2).toBeDefined();
        expect(doc2!.filename).toBe('doc2.docx');
      }
    });

    it('should return empty array when lesson has no documents', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.documents).toEqual([]);
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid lesson ID', async () => {
      // Arrange
      const request = createValidRequest({ lessonId: 'invalid-uuid' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for empty lesson ID', async () => {
      // Arrange
      const request: any = { lessonId: '' };

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
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when document repository fails', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(documentRepo, 'findByLesson').mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Database connection failed');
      }
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle documents with minimal translations', async () => {
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

      const document = Document.create({
        filename: 'minimal.pdf',
        translations,
      });

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.documents).toHaveLength(1);
        expect(result.value.documents[0].translations).toHaveLength(1);
      }
    });

    it('should handle multiple documents with same filename pattern', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const documents: Document[] = [];
      for (let i = 1; i <= 5; i++) {
        const translations = createDocumentTranslations(`Document ${i}`);
        const doc = Document.create({
          filename: `document-${i}.pdf`,
          translations,
        });
        documents.push(doc);
        await documentRepo.create(lesson.id.toString(), doc, translations);
      }

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.documents).toHaveLength(5);
        const filenames = result.value.documents.map((d) => d.filename);
        expect(filenames).toEqual(
          expect.arrayContaining([
            'document-1.pdf',
            'document-2.pdf',
            'document-3.pdf',
            'document-4.pdf',
            'document-5.pdf',
          ]),
        );
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle listing many documents efficiently', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      // Create 50 documents
      for (let i = 0; i < 50; i++) {
        const translations = createDocumentTranslations(`Document ${i}`);
        const doc = Document.create({
          filename: `doc-${i}.pdf`,
          translations,
        });
        await documentRepo.create(lesson.id.toString(), doc, translations);
      }

      const request = createValidRequest();
      const start = Date.now();

      // Act
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.documents).toHaveLength(50);
      }
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should list only documents for the specified lesson', async () => {
      // Arrange
      const lesson1 = createTestLesson('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const lesson2 = createTestLesson('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      await lessonRepo.create(lesson1);
      await lessonRepo.create(lesson2);

      // Documents for lesson1
      const translations1 = createDocumentTranslations('Lesson1 Doc');
      const doc1 = Document.create({
        filename: 'lesson1-doc.pdf',
        translations: translations1,
      });
      await documentRepo.create(lesson1.id.toString(), doc1, translations1);

      // Documents for lesson2
      const translations2 = createDocumentTranslations('Lesson2 Doc');
      const doc2 = Document.create({
        filename: 'lesson2-doc.pdf',
        translations: translations2,
      });
      await documentRepo.create(lesson2.id.toString(), doc2, translations2);

      const request = createValidRequest({ lessonId: lesson1.id.toString() });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.documents).toHaveLength(1);
        expect(result.value.documents[0].filename).toBe('lesson1-doc.pdf');
      }
    });

    it('should ensure all document data is properly mapped', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepo.create(lesson);

      const translations = createDocumentTranslations('Complete Doc');
      const document = Document.create({
        filename: 'complete.pdf',
        translations,
      });
      const docId = document.id.toString();
      const createdAt = document.createdAt;
      const updatedAt = document.updatedAt;

      await documentRepo.create(lesson.id.toString(), document, translations);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const doc = result.value.documents[0];
        expect(doc.id).toBe(docId);
        expect(doc.filename).toBe('complete.pdf');
        expect(doc.createdAt).toEqual(createdAt);
        expect(doc.updatedAt).toEqual(updatedAt);
        expect(doc.translations).toHaveLength(3);
      }
    });
  });
});
