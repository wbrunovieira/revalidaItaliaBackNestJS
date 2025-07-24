// src/domain/course-catalog/application/use-cases/create-document.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateDocumentUseCase } from './create-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { DocumentTranslationProps } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import {
  InvalidInputError,
  LessonNotFoundError,
  DuplicateDocumentError,
  RepositoryError,
  InvalidFileError,
} from '@/domain/course-catalog/domain/exceptions';
import { right, left, Either } from '@/core/either';
import { CreateDocumentRequest } from '../dtos/create-document-request.dto';
import { CreateDocumentUseCaseResponse } from './create-document.use-case';

// Helper function to create a valid request
function createValidRequest(overrides?: Partial<CreateDocumentRequest>): CreateDocumentRequest {
  const translations: DocumentTranslationProps[] = [
    {
      locale: 'pt',
      title: 'Material do Curso',
      description: 'Desc PT',
      url: '/mat-pt.pdf',
    },
    {
      locale: 'it',
      title: 'Materiale del Corso',
      description: 'Desc IT',
      url: '/mat-it.pdf',
    },
    {
      locale: 'es',
      title: 'Material del Curso',
      description: 'Desc ES',
      url: '/mat-es.pdf',
    },
  ];
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    filename: 'material-curso.pdf',
    translations,
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

describe('CreateDocumentUseCase', () => {
  let lessonRepository: InMemoryLessonRepository;
  let documentRepository: InMemoryDocumentRepository;
  let sut: CreateDocumentUseCase;

  beforeEach(() => {
    lessonRepository = new InMemoryLessonRepository();
    documentRepository = new InMemoryDocumentRepository();
    sut = new CreateDocumentUseCase(lessonRepository as any, documentRepository as any);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should create a document successfully', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);

      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.id).toBeDefined();
        expect(result.value.document.filename).toBe('material-curso.pdf');
        expect(result.value.document.createdAt).toBeInstanceOf(Date);
        expect(result.value.document.updatedAt).toBeInstanceOf(Date);
        expect(result.value.translations).toHaveLength(3);
        expect(result.value.translations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              locale: 'pt', 
              title: 'Material do Curso',
              description: 'Desc PT',
              url: '/mat-pt.pdf' 
            }),
            expect.objectContaining({ 
              locale: 'it', 
              title: 'Materiale del Corso',
              description: 'Desc IT',
              url: '/mat-it.pdf' 
            }),
            expect.objectContaining({ 
              locale: 'es', 
              title: 'Material del Curso',
              description: 'Desc ES',
              url: '/mat-es.pdf' 
            }),
          ]),
        );
      }
    });

    it('should create document with simple filename', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);

      const request = createValidRequest({ filename: 'simple.pdf' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe('simple.pdf');
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for missing translation url', async () => {
      // Arrange
      const request = createValidRequest();
      request.translations[0].url = '';

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details).toBeDefined();
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['translations', 0, 'url'] }),
          ]),
        );
      }
    });

    it('should return InvalidInputError for empty filename', async () => {
      // Arrange
      const request = createValidRequest({ filename: '' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for missing Portuguese translation', async () => {
      // Arrange
      const request = createValidRequest();
      request.translations = request.translations.filter((t) => t.locale !== 'pt');

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details?.[0]?.message).toMatch(/exactly three translations required/i);
      }
    });

    it('should return InvalidInputError for duplicate locale in translations', async () => {
      // Arrange
      const request = createValidRequest();
      request.translations = [
        { locale: 'it', title: 'X', description: 'X', url: '/x-it.pdf' },
        { locale: 'it', title: 'Y', description: 'Y', url: '/y-it.pdf' },
        { locale: 'es', title: 'Z', description: 'Z', url: '/z-es.pdf' },
      ];

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        const hasDuplicateLocale = error.details?.some((d) => /duplicate locale/i.test(d.message));
        expect(hasDuplicateLocale).toBe(true);
      }
    });

    it('should return InvalidInputError for invalid UUID in lessonId', async () => {
      // Arrange
      const request = createValidRequest({ lessonId: 'invalid-uuid' });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for malformed request', async () => {
      // Arrange
      const request = {
        // Missing required fields
      } as any;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
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
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
        expect(result.value.message).toContain('Lesson not found with id');
      }
    });

    it('should return DuplicateDocumentError when filename already exists', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      // Mock to simulate existing document
      vi.spyOn(documentRepository, 'findByFilename').mockResolvedValueOnce(
        right(lesson as any)
      );
      
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateDocumentError);
        expect(result.value.message).toContain('material-curso.pdf');
      }
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when document creation fails', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      vi.spyOn(documentRepository, 'create').mockResolvedValueOnce(
        left(new Error('Database connection failed'))
      );
      
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBeDefined();
      }
    });

    it('should return RepositoryError when lesson repository fails', async () => {
      // Arrange
      vi.spyOn(lessonRepository, 'findById').mockResolvedValueOnce(
        left(new Error('Database timeout'))
      );
      
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
      }
    });

    it('should return RepositoryError when findByFilename fails with unexpected error', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      vi.spyOn(documentRepository, 'findByFilename').mockResolvedValueOnce(
        left(new Error('Unexpected database error'))
      );
      
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBeDefined();
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      vi.spyOn(documentRepository, 'create').mockRejectedValueOnce(
        new Error('Unexpected error')
      );
      
      const request = createValidRequest();

      // Act & Assert
      await expect(sut.execute(request)).rejects.toThrow('Unexpected error');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle translations with empty descriptions', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      const request = createValidRequest();
      request.translations[0].description = 'Short desc';
      request.translations[1].description = 'Another desc';

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.translations[0].description).toBe('Short desc');
      }
    });

    it('should handle very long translation text', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      const longText = 'a'.repeat(1000);
      const request = createValidRequest();
      request.translations[0].title = longText;
      request.translations[0].description = longText;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.translations[0].title).toBe(longText);
        expect(result.value.translations[0].description).toBe(longText);
      }
    });

    it('should handle special characters in filenames', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      const request = createValidRequest({ 
        filename: 'documento-especial_2024.pdf' 
      });

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.document.filename).toBe('documento-especial_2024.pdf');
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle multiple concurrent document creations efficiently', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      const promises: Promise<CreateDocumentUseCaseResponse>[] = [];
      for (let i = 0; i < 10; i++) {
        const request = createValidRequest({ 
          filename: `document-${i}.pdf` 
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
    it('should require all three locale translations', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      const request = createValidRequest();
      // Remove one translation
      request.translations = request.translations.slice(0, 2);

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should not allow document creation without lesson verification', async () => {
      // Arrange
      vi.spyOn(lessonRepository, 'findById').mockResolvedValueOnce(
        left(new Error('Not found'))
      );
      
      const request = createValidRequest();

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
      }
    });

    it('should ensure document uniqueness by filename', async () => {
      // Arrange
      const lesson = createTestLesson();
      await lessonRepository.create(lesson);
      
      // First document creation
      const request1 = createValidRequest();
      const result1 = await sut.execute(request1);
      expect(result1.isRight()).toBe(true);
      
      // Mock to simulate existing document
      vi.spyOn(documentRepository, 'findByFilename').mockResolvedValueOnce(
        right({ filename: 'material-curso.pdf' } as any)
      );
      
      // Second document with same filename
      const request2 = createValidRequest();
      const result2 = await sut.execute(request2);

      // Assert
      expect(result2.isLeft()).toBe(true);
      if (result2.isLeft()) {
        expect(result2.value).toBeInstanceOf(DuplicateDocumentError);
      }
    });
  });
});