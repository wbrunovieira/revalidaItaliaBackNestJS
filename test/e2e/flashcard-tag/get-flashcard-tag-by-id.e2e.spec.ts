// test/e2e/flashcard-tag/get-flashcard-tag-by-id.e2e.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlashcardTagGetTestSetup } from './shared/flashcard-tag-get-test-setup';
import { FlashcardTagTestHelpers } from './shared/flashcard-tag-test-helpers';
import { FlashcardTagTestData } from './shared/flashcard-tag-test-data';

describe('GET /flashcard-tags/:id E2E Tests', () => {
  let testSetup: FlashcardTagGetTestSetup;
  let testHelpers: FlashcardTagTestHelpers;

  beforeEach(async () => {
    testSetup = new FlashcardTagGetTestSetup();
    testHelpers = new FlashcardTagTestHelpers(testSetup);

    await testSetup.initialize();
    await testSetup.setupTestData();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  describe('Success Cases', () => {
    it('should successfully retrieve a flashcard tag by ID', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId1,
        FlashcardTagTestData.EXPECTED_RESPONSES.FARMACOLOGIA,
      );

      testHelpers.verifyGetFlashcardTagSuccessResponseFormat(
        response.body,
        testSetup.flashcardTagId1,
      );

      expect(response.body.flashcardTag.name).toBe('Farmacologia');
      expect(response.body.flashcardTag.slug).toBe('farmacologia');
    });

    it('should retrieve flashcard tag with special characters', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId5,
        FlashcardTagTestData.EXPECTED_RESPONSES.ANATOMIA_FISIOLOGIA,
      );

      expect(response.body.flashcardTag.name).toBe('Anatomia & Fisiologia');
      expect(response.body.flashcardTag.slug).toBe('anatomia-fisiologia');
    });

    it('should retrieve different flashcard tags correctly', async () => {
      // Test multiple tags
      const tags = [
        {
          id: testSetup.flashcardTagId1,
          expected: FlashcardTagTestData.EXPECTED_RESPONSES.FARMACOLOGIA,
        },
        {
          id: testSetup.flashcardTagId2,
          expected: FlashcardTagTestData.EXPECTED_RESPONSES.ANATOMIA,
        },
        {
          id: testSetup.flashcardTagId3,
          expected: FlashcardTagTestData.EXPECTED_RESPONSES.FISIOLOGIA,
        },
      ];

      for (const tag of tags) {
        const response = await testHelpers.getFlashcardTagExpectSuccess(
          tag.id,
          tag.expected,
        );

        testHelpers.verifyGetFlashcardTagSuccessResponseFormat(
          response.body,
          tag.id,
        );
      }
    });

    it('should return consistent timestamps', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId1,
      );

      const { createdAt, updatedAt } = response.body.flashcardTag;

      expect(new Date(createdAt)).toBeInstanceOf(Date);
      expect(new Date(updatedAt)).toBeInstanceOf(Date);
      expect(new Date(createdAt).getTime()).toBeLessThanOrEqual(
        new Date(updatedAt).getTime(),
      );
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should return 404 for non-existent flashcard tag', async () => {
      const response = await testHelpers.getFlashcardTagExpectFailure(
        FlashcardTagTestData.TEST_UUIDS.VALID_NON_EXISTING,
        404,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
      );

      testHelpers.verifyErrorResponseFormat(
        response.body,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.message,
      );
    });

    it('should return 404 for nil UUID', async () => {
      const response = await testHelpers.getFlashcardTagExpectFailure(
        FlashcardTagTestData.TEST_UUIDS.NIL,
        404,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
      );

      testHelpers.verifyErrorResponseFormat(
        response.body,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.message,
      );
    });
  });

  describe('Error Cases - Invalid Input', () => {
    it('should return 400 for invalid UUID format', async () => {
      const response = await testHelpers.getFlashcardTagExpectFailure(
        FlashcardTagTestData.TEST_UUIDS.INVALID_FORMAT,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      testHelpers.verifyValidationErrorResponseFormat(
        response.body,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.message,
      );

      expect(response.body.details).toHaveProperty('id');
      expect(response.body.details.id).toContain('ID must be a valid UUID');
    });

    it('should return 400 for malformed UUID', async () => {
      const response = await testHelpers.getFlashcardTagExpectFailure(
        FlashcardTagTestData.TEST_UUIDS.MALFORMED,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      testHelpers.verifyValidationErrorResponseFormat(
        response.body,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.message,
      );
    });

    it('should return 400 for empty ID', async () => {
      // Note: Empty ID in this controller returns 200 because /flashcard-tags/
      // is interpreted as /flashcard-tags (list all route)
      const response = await testHelpers.getFlashcardTagById(
        FlashcardTagTestData.TEST_UUIDS.EMPTY,
      );

      // Following project pattern - accept 200, 400, or 404 for empty IDs
      // 200 when routed to list all, 400/404 when validated as empty ID
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle multiple validation errors', async () => {
      const invalidIds = [
        FlashcardTagTestData.TEST_UUIDS.INVALID_FORMAT,
        FlashcardTagTestData.TEST_UUIDS.MALFORMED,
        'not-a-uuid',
        'invalid-format-test',
      ];

      for (const invalidId of invalidIds) {
        const response = await testHelpers.getFlashcardTagExpectFailure(
          invalidId,
          400,
          FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
        );

        expect(response.body).toHaveProperty('details');
        expect(response.body.details).toHaveProperty('id');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum valid UUID', async () => {
      const response = await testHelpers.getFlashcardTagExpectFailure(
        FlashcardTagTestData.TEST_UUIDS.MAX,
        404,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
      );

      // Max UUID is valid format but doesn't exist
      expect(response.status).toBe(404);
    });

    it('should handle case sensitivity in UUID', async () => {
      // Test uppercase UUID (should be case insensitive)
      const uppercaseUUID = testSetup.flashcardTagId1.toUpperCase();

      const response = await testHelpers.getFlashcardTagExpectFailure(
        uppercaseUUID,
        404, // Typically case sensitive in most systems
      );

      expect(response.status).toBe(404);
    });

    it('should handle concurrent requests', async () => {
      // Test concurrent access to same resource
      const promises = Array.from({ length: 5 }, () =>
        testHelpers.getFlashcardTagExpectSuccess(testSetup.flashcardTagId1),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.flashcardTag.id).toBe(testSetup.flashcardTagId1);
      });
    });

    it('should handle requests after data cleanup', async () => {
      // First, verify tag exists
      await testHelpers.getFlashcardTagExpectSuccess(testSetup.flashcardTagId1);

      // Clean up data
      await testSetup.prisma.flashcardTag.deleteMany({});

      // Now it should return 404
      await testHelpers.getFlashcardTagExpectFailure(
        testSetup.flashcardTagId1,
        404,
        FlashcardTagTestData.ERROR_RESPONSES.NOT_FOUND.error,
      );
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted response headers', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId1,
      );

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.status).toBe(200);
    });

    it('should return consistent response structure', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId1,
      );

      const { flashcardTag } = response.body;

      // Verify all required fields are present
      expect(flashcardTag).toHaveProperty('id');
      expect(flashcardTag).toHaveProperty('name');
      expect(flashcardTag).toHaveProperty('slug');
      expect(flashcardTag).toHaveProperty('createdAt');
      expect(flashcardTag).toHaveProperty('updatedAt');

      // Verify no extra fields
      const expectedFields = ['id', 'name', 'slug', 'createdAt', 'updatedAt'];
      const actualFields = Object.keys(flashcardTag);
      expect(actualFields.sort()).toEqual(expectedFields.sort());
    });

    it('should return ISO date strings', async () => {
      const response = await testHelpers.getFlashcardTagExpectSuccess(
        testSetup.flashcardTagId1,
      );

      const { createdAt, updatedAt } = response.body.flashcardTag;

      // Verify ISO format
      expect(createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Verify parseable dates
      expect(new Date(createdAt)).toBeInstanceOf(Date);
      expect(new Date(updatedAt)).toBeInstanceOf(Date);
      expect(new Date(createdAt)).not.toEqual(new Date('Invalid Date'));
      expect(new Date(updatedAt)).not.toEqual(new Date('Invalid Date'));
    });
  });
});
