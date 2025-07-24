// test/e2e/flashcard/get-flashcard-by-id.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FlashcardContentType } from '@prisma/client';
import { FlashcardTestSetup } from './shared/flashcard-test-setup';
import { FlashcardTestHelpers } from './shared/flashcard-test-helpers';
import { FlashcardTestData } from './shared/flashcard-test-data';

describe('GET /flashcards/:id', () => {
  let testSetup: FlashcardTestSetup;
  let testHelpers: FlashcardTestHelpers;

  beforeAll(async () => {
    testSetup = new FlashcardTestSetup();
    await testSetup.initialize();
    testHelpers = new FlashcardTestHelpers(testSetup.getHttpServer());
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  describe('Success scenarios', () => {
    it('should get a flashcard by ID without filters', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard();

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          slug: 'test-flashcard',
          question: {
            type: 'TEXT',
            content: 'What is Domain-Driven Design?',
          },
          answer: {
            type: 'TEXT',
            content:
              'DDD is an approach to software development that centers the development on programming a domain model',
          },
          argumentId: testSetup.argumentId,
        },
      });
      expect(response.body.flashcard.createdAt).toBeDefined();
      expect(response.body.flashcard.updatedAt).toBeDefined();
      expect(response.body.flashcard.tags).toBeUndefined();
    });

    it('should get a flashcard with tags when includeTags is true', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        { includeTags: true },
      );

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          slug: 'test-flashcard',
          question: {
            type: 'TEXT',
            content: 'What is Domain-Driven Design?',
          },
          answer: {
            type: 'TEXT',
            content:
              'DDD is an approach to software development that centers the development on programming a domain model',
          },
          argumentId: testSetup.argumentId,
          tags: expect.arrayContaining([
            expect.objectContaining({
              id: testSetup.flashcardTagId1,
              name: 'Anatomy',
              slug: 'anatomy',
            }),
            expect.objectContaining({
              id: testSetup.flashcardTagId2,
              name: 'Physiology',
              slug: 'physiology',
            }),
          ]),
        },
      });
      expect(response.body.flashcard.tags).toHaveLength(2);
    });

    it('should handle all filters set to true', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        {
          includeTags: true,
          includeInteractionStats: true,
          includeRelatedFlashcards: true,
        },
      );

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          tags: expect.arrayContaining([
            expect.objectContaining({
              id: testSetup.flashcardTagId1,
              name: 'Anatomy',
              slug: 'anatomy',
            }),
          ]),
        },
      });
    });

    it('should handle all filters set to false', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        {
          includeTags: false,
          includeInteractionStats: false,
          includeRelatedFlashcards: false,
        },
      );

      // Assert
      expect(response.body.flashcard.tags).toBeUndefined();
    });

    it('should handle mixed filter values', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        {
          includeTags: true,
          includeInteractionStats: false,
          includeRelatedFlashcards: true,
        },
      );

      // Assert
      expect(response.body.flashcard.tags).toBeDefined();
      expect(response.body.flashcard.tags).toHaveLength(2);
    });

    it('should handle different content types - IMAGE/IMAGE', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        id: testSetup.flashcardId2,
        slug: 'image-flashcard',
        questionType: FlashcardContentType.IMAGE,
        answerType: FlashcardContentType.IMAGE,
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          slug: 'image-flashcard',
          question: {
            type: 'IMAGE',
            content: 'https://example.com/question.jpg',
          },
          answer: {
            type: 'IMAGE',
            content: 'https://example.com/answer.jpg',
          },
        },
      });
    });

    it('should handle different content types - IMAGE/TEXT', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        id: testSetup.flashcardId2,
        slug: 'mixed-flashcard-1',
        questionType: FlashcardContentType.IMAGE,
        answerType: FlashcardContentType.TEXT,
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          question: {
            type: 'IMAGE',
            content: 'https://example.com/question.jpg',
          },
          answer: {
            type: 'TEXT',
            content:
              'DDD is an approach to software development that centers the development on programming a domain model',
          },
        },
      });
    });

    it('should handle different content types - TEXT/IMAGE', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        id: testSetup.flashcardId2,
        slug: 'mixed-flashcard-2',
        questionType: FlashcardContentType.TEXT,
        answerType: FlashcardContentType.IMAGE,
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          question: {
            type: 'TEXT',
            content: 'What is Domain-Driven Design?',
          },
          answer: {
            type: 'IMAGE',
            content: 'https://example.com/answer.jpg',
          },
        },
      });
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 when flashcard does not exist', async () => {
      // Arrange
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectNotFound(nonExistentId);

      // Assert
      expect(response.body).toMatchObject({
        error: 'FLASHCARD_NOT_FOUND',
        message: `Flashcard with ID "${nonExistentId}" not found`,
      });
    });

    it('should return 400 when ID is invalid UUID', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectBadRequest(invalidId);

      // Assert
      expect(response.body).toMatchObject({
        error: 'INVALID_INPUT',
        message: 'Invalid input data',
        details: {
          id: expect.arrayContaining(['ID must be a valid UUID']),
        },
      });
    });

    it('should return 404 when ID is empty', async () => {
      // Act
      const response = await testHelpers.getFlashcardByIdExpectNotFound('');

      // Assert
      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Cannot GET /flashcards/',
      });
    });

    it('should return 400 with multiple filter errors', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard();

      // Act - Send invalid filter values
      const response = await testHelpers.getFlashcardById(flashcardId, {
        includeTags: 'invalid-boolean',
        includeInteractionStats: 'invalid-boolean',
        includeRelatedFlashcards: 'invalid-boolean',
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        message: expect.arrayContaining([
          'includeTags must be a boolean value',
          'includeInteractionStats must be a boolean value',
          'includeRelatedFlashcards must be a boolean value',
        ]),
        error: 'Bad Request',
      });
    });
  });

  describe('Query parameter transformations', () => {
    it('should transform string "true" to boolean true', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        {
          includeTags: 'true',
        },
      );

      // Assert
      expect(response.body.flashcard.tags).toBeDefined();
      expect(response.body.flashcard.tags).toHaveLength(2);
    });

    it('should transform string "false" to boolean false', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard({
        withTags: true,
      });

      // Act
      const response = await testHelpers.getFlashcardByIdExpectSuccess(
        flashcardId,
        {
          includeTags: 'false',
        },
      );

      // Assert
      expect(response.body.flashcard.tags).toBeUndefined();
    });

    it('should handle empty query object', async () => {
      // Arrange
      const flashcardId = await testSetup.createTestFlashcard();

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body.flashcard).toBeDefined();
      expect(response.body.flashcard.tags).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle flashcard with minimal data', async () => {
      // Arrange - Create flashcard with minimal required fields
      const flashcardId = '550e8400-e29b-41d4-a716-446655440100';
      await testSetup.prisma.flashcard.create({
        data: {
          id: flashcardId,
          slug: 'minimal-flashcard',
          questionText: 'Q',
          questionType: FlashcardContentType.TEXT,
          answerText: 'A',
          answerType: FlashcardContentType.TEXT,
          argumentId: testSetup.argumentId,
        },
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          slug: 'minimal-flashcard',
          question: {
            type: 'TEXT',
            content: 'Q',
          },
          answer: {
            type: 'TEXT',
            content: 'A',
          },
        },
      });
    });

    it('should handle maximum length content', async () => {
      // Arrange
      const maxContent = 'a'.repeat(1000);
      const flashcardId = '550e8400-e29b-41d4-a716-446655440101';
      await testSetup.prisma.flashcard.create({
        data: {
          id: flashcardId,
          slug: 'max-content-flashcard',
          questionText: maxContent,
          questionType: FlashcardContentType.TEXT,
          answerText: maxContent,
          answerType: FlashcardContentType.TEXT,
          argumentId: testSetup.argumentId,
        },
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body.flashcard.question.content).toHaveLength(1000);
      expect(response.body.flashcard.answer.content).toHaveLength(1000);
    });

    it('should handle flashcard with optional fields', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440102';
      await testSetup.prisma.flashcard.create({
        data: {
          id: flashcardId,
          slug: 'optional-flashcard',
          questionText: 'Question with optional fields',
          questionType: FlashcardContentType.TEXT,
          answerText: 'Answer with optional fields',
          answerType: FlashcardContentType.TEXT,
          argumentId: testSetup.argumentId,
          importBatchId: 'batch-123',
          exportedAt: new Date('2024-01-15T00:00:00Z'),
        },
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        flashcard: {
          id: flashcardId,
          importBatchId: 'batch-123',
          exportedAt: expect.stringMatching(/2024-01-15/),
        },
      });
    });
  });

  describe('Performance and special characters', () => {
    it('should handle special characters in content', async () => {
      // Arrange
      const specialContent =
        'Special chars: "quotes", \'single\', <tags>, &amp;, \\backslash, \n\nnewlines';
      const flashcardId = '550e8400-e29b-41d4-a716-446655440103';
      await testSetup.prisma.flashcard.create({
        data: {
          id: flashcardId,
          slug: 'special-chars-flashcard',
          questionText: specialContent,
          questionType: FlashcardContentType.TEXT,
          answerText: specialContent,
          answerType: FlashcardContentType.TEXT,
          argumentId: testSetup.argumentId,
        },
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body.flashcard.question.content).toBe(specialContent);
      expect(response.body.flashcard.answer.content).toBe(specialContent);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const unicodeContent = 'Unicode: 你好世界 🌍 😀 Olá çñü';
      const flashcardId = '550e8400-e29b-41d4-a716-446655440104';
      await testSetup.prisma.flashcard.create({
        data: {
          id: flashcardId,
          slug: 'unicode-flashcard',
          questionText: unicodeContent,
          questionType: FlashcardContentType.TEXT,
          answerText: unicodeContent,
          answerType: FlashcardContentType.TEXT,
          argumentId: testSetup.argumentId,
        },
      });

      // Act
      const response =
        await testHelpers.getFlashcardByIdExpectSuccess(flashcardId);

      // Assert
      expect(response.body.flashcard.question.content).toBe(unicodeContent);
      expect(response.body.flashcard.answer.content).toBe(unicodeContent);
    });
  });
});
