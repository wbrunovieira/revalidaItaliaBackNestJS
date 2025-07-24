// test/e2e/flashcard/post-create-flashcard.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import { FlashcardTestSetup } from './shared/flashcard-test-setup';
import { FlashcardTestHelpers } from './shared/flashcard-test-helpers';
import { FlashcardTestData } from './shared/flashcard-test-data';

describe('POST /flashcards (E2E)', () => {
  let testSetup: FlashcardTestSetup;
  let testHelpers: FlashcardTestHelpers;

  beforeAll(async () => {
    testSetup = new FlashcardTestSetup();
    await testSetup.initialize();
    testHelpers = new FlashcardTestHelpers(testSetup.getHttpServer());
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('Success scenarios', () => {
    it('should create a flashcard with TEXT/TEXT content', async () => {
      const data = FlashcardTestData.validRequests.textOnly();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('flashcard');

      const { flashcard } = response.body;
      expect(flashcard).toHaveProperty('id');
      expect(flashcard).toHaveProperty('slug');
      expect(flashcard.question).toEqual({
        type: 'TEXT',
        content: data.question.content,
      });
      expect(flashcard.answer).toEqual({
        type: 'TEXT',
        content: data.answer.content,
      });
      expect(flashcard.argumentId).toBe(data.argumentId);
      expect(flashcard.tagIds).toEqual([]);
      expect(flashcard).toHaveProperty('createdAt');
      expect(flashcard).toHaveProperty('updatedAt');

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
        include: { tags: true },
      });

      expect(dbFlashcard).toBeTruthy();
      expect(dbFlashcard?.questionText).toBe(data.question.content);
      expect(dbFlashcard?.questionType).toBe(data.question.type);
      expect(dbFlashcard?.answerText).toBe(data.answer.content);
      expect(dbFlashcard?.answerType).toBe(data.answer.type);
      expect(dbFlashcard?.tags).toHaveLength(0);
    });

    it('should create a flashcard with IMAGE/IMAGE content', async () => {
      const data = FlashcardTestData.validRequests.imageOnly();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('flashcard');

      const { flashcard } = response.body;
      expect(flashcard.question).toEqual({
        type: 'IMAGE',
        content: data.question.content,
      });
      expect(flashcard.answer).toEqual({
        type: 'IMAGE',
        content: data.answer.content,
      });

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
      });

      expect(dbFlashcard?.questionImageUrl).toBe(data.question.content);
      expect(dbFlashcard?.questionType).toBe(data.question.type);
      expect(dbFlashcard?.answerImageUrl).toBe(data.answer.content);
      expect(dbFlashcard?.answerType).toBe(data.answer.type);
    });

    it('should create a flashcard with IMAGE/TEXT content', async () => {
      const data = FlashcardTestData.validRequests.imageText();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.question.type).toBe('IMAGE');
      expect(flashcard.answer.type).toBe('TEXT');

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
      });

      expect(dbFlashcard?.questionImageUrl).toBe(data.question.content);
      expect(dbFlashcard?.answerText).toBe(data.answer.content);
    });

    it('should create a flashcard with TEXT/IMAGE content', async () => {
      const data = FlashcardTestData.validRequests.textImage();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.question.type).toBe('TEXT');
      expect(flashcard.answer.type).toBe('IMAGE');

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
      });

      expect(dbFlashcard?.questionText).toBe(data.question.content);
      expect(dbFlashcard?.answerImageUrl).toBe(data.answer.content);
    });

    it('should create a flashcard with tags', async () => {
      const data = FlashcardTestData.validRequests.withTags();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.tagIds).toHaveLength(2);
      expect(flashcard.tagIds).toContain(data.tagIds[0]);
      expect(flashcard.tagIds).toContain(data.tagIds[1]);

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
        include: { tags: true },
      });

      expect(dbFlashcard?.tags).toHaveLength(2);
      const tagIds = dbFlashcard?.tags.map((tag) => tag.id) || [];
      expect(tagIds).toContain(data.tagIds[0]);
      expect(tagIds).toContain(data.tagIds[1]);
    });

    it('should create a flashcard with custom slug', async () => {
      const data = FlashcardTestData.validRequests.withCustomSlug();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.slug).toBe(data.slug);

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { slug: data.slug },
      });

      expect(dbFlashcard).toBeTruthy();
    });

    it('should create a flashcard with import batch ID', async () => {
      const data = FlashcardTestData.validRequests.withImportBatchId();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.importBatchId).toBe(data.importBatchId);

      // Verify in database
      const dbFlashcard = await testSetup.prisma.flashcard.findUnique({
        where: { id: flashcard.id },
      });

      expect(dbFlashcard?.importBatchId).toBe(data.importBatchId);
    });

    it('should create a flashcard with all optional fields', async () => {
      const data = FlashcardTestData.validRequests.complete();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.slug).toBe(data.slug);
      expect(flashcard.tagIds).toHaveLength(1);
      expect(flashcard.tagIds[0]).toBe(data.tagIds[0]);
      expect(flashcard.importBatchId).toBe(data.importBatchId);
    });

    it('should auto-generate slug when not provided', async () => {
      const data = FlashcardTestData.validRequests.textOnly();
      const response = await testHelpers.createFlashcardExpectSuccess(data);

      const { flashcard } = response.body;
      expect(flashcard.slug).toBeTruthy();
      expect(flashcard.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when question is missing', async () => {
      const data = FlashcardTestData.invalidRequests.missingQuestion();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 400 when answer is missing', async () => {
      const data = FlashcardTestData.invalidRequests.missingAnswer();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 400 when argumentId is missing', async () => {
      const data = FlashcardTestData.invalidRequests.missingArgumentId();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 400 when question type is invalid', async () => {
      const data = FlashcardTestData.invalidRequests.invalidQuestionType();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('TEXT, IMAGE');
    });

    it('should return 400 when question content is empty', async () => {
      const data = FlashcardTestData.invalidRequests.emptyQuestionContent();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('content should not be empty');
    });

    it('should return 400 when content is too long', async () => {
      const data = FlashcardTestData.invalidRequests.tooLongContent();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('1000 characters');
    });

    it('should return 400 when argumentId is invalid UUID', async () => {
      const data = FlashcardTestData.invalidRequests.invalidArgumentId();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('UUID');
    });

    it('should return 400 when tagIds contains invalid UUID', async () => {
      const data = FlashcardTestData.invalidRequests.invalidTagIds();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('UUID');
    });

    it('should return 400 when slug format is invalid', async () => {
      const data = FlashcardTestData.invalidRequests.invalidSlug();
      const response = await testHelpers.createFlashcardExpectBadRequest(data);

      expect(response.body).toHaveProperty('message');
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('lowercase letters, numbers, and hyphens');
    });
  });

  describe('Business logic errors', () => {
    it('should return 404 when argument does not exist', async () => {
      const data = FlashcardTestData.invalidRequests.nonExistentArgumentId();
      const response = await testHelpers.createFlashcardExpectNotFound(data);

      expect(response.body).toHaveProperty('error', 'ARGUMENT_NOT_FOUND');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when tag does not exist', async () => {
      const data = FlashcardTestData.invalidRequests.nonExistentTagIds();
      const response = await testHelpers.createFlashcardExpectNotFound(data);

      expect(response.body).toHaveProperty('error', 'FLASHCARD_TAGS_NOT_FOUND');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 when slug already exists', async () => {
      // First create a flashcard with a specific slug
      await testSetup.createFlashcardWithSlug('existing-slug');

      // Try to create another with the same slug
      const data = FlashcardTestData.invalidRequests.duplicateSlug();
      const response = await testHelpers.createFlashcardExpectConflict(data);

      expect(response.body).toHaveProperty('error', 'DUPLICATE_FLASHCARD');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in text content', async () => {
      const data = {
        question: {
          type: 'TEXT',
          content:
            'What\'s the "best" way to handle <special> characters & symbols?',
        },
        answer: {
          type: 'TEXT',
          content: 'Use proper escaping: \', ", <, >, &',
        },
        argumentId: testSetup.argumentId,
      };

      const response = await testHelpers.createFlashcardExpectSuccess(data);
      const { flashcard } = response.body;

      expect(flashcard.question.content).toBe(data.question.content);
      expect(flashcard.answer.content).toBe(data.answer.content);
    });

    it('should handle Unicode characters', async () => {
      const data = {
        question: {
          type: 'TEXT',
          content: 'What is 医学 in English?',
        },
        answer: {
          type: 'TEXT',
          content: 'Medicine (医学 = igaku)',
        },
        argumentId: testSetup.argumentId,
      };

      const response = await testHelpers.createFlashcardExpectSuccess(data);
      const { flashcard } = response.body;

      expect(flashcard.question.content).toBe(data.question.content);
      expect(flashcard.answer.content).toBe(data.answer.content);
    });

    it('should handle maximum length content', async () => {
      const maxQuestionContent = 'a'.repeat(1000);
      const maxAnswerContent = 'b'.repeat(1000); // Different content for answer
      const data = {
        question: {
          type: 'TEXT',
          content: maxQuestionContent,
        },
        answer: {
          type: 'TEXT',
          content: maxAnswerContent,
        },
        argumentId: testSetup.argumentId,
        slug: 'max-content-test', // Provide a slug to avoid auto-generation from long content
      };

      const response = await testHelpers.createFlashcardExpectSuccess(data);
      const { flashcard } = response.body;

      expect(flashcard.question.content).toBe(maxQuestionContent);
      expect(flashcard.answer.content).toBe(maxAnswerContent);
      expect(flashcard.slug).toBe('max-content-test');
    });

    it('should handle empty arrays for tagIds', async () => {
      const data = {
        ...FlashcardTestData.validRequests.textOnly(),
        tagIds: [],
      };

      const response = await testHelpers.createFlashcardExpectSuccess(data);
      const { flashcard } = response.body;

      expect(flashcard.tagIds).toEqual([]);
    });
  });
});
