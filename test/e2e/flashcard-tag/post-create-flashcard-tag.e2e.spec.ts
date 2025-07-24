// test/e2e/flashcard-tag/post-create-flashcard-tag.e2e.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlashcardTagTestSetup } from './shared/flashcard-tag-test-setup';
import { FlashcardTagTestHelpers } from './shared/flashcard-tag-test-helpers';
import { FlashcardTagTestData } from './shared/flashcard-tag-test-data';

describe('POST /flashcard-tags E2E Tests', () => {
  let testSetup: FlashcardTagTestSetup;
  let testHelpers: FlashcardTagTestHelpers;

  beforeEach(async () => {
    testSetup = new FlashcardTagTestSetup();
    testHelpers = new FlashcardTagTestHelpers(testSetup);

    await testSetup.initialize();
    await testSetup.setupTestData();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  describe('Success Cases', () => {
    it('should successfully create a flashcard tag with simple name', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      testHelpers.verifyCreateFlashcardTagSuccessResponseFormat(
        response.body,
        requestData.name,
      );

      expect(response.body.flashcardTag.name).toBe('Farmacologia');
      expect(response.body.flashcardTag.slug).toBe('farmacologia');
      expect(response.body.flashcardTag.id).toBeDefined();
      expect(response.body.flashcardTag.createdAt).toBeDefined();
      expect(response.body.flashcardTag.updatedAt).toBeDefined();
    });

    it('should successfully create a flashcard tag with custom slug', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.WITH_SLUG;

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        {
          name: requestData.name,
          slug: requestData.slug,
        },
      );

      expect(response.body.flashcardTag.name).toBe('Anatomia Cardiovascular');
      expect(response.body.flashcardTag.slug).toBe('anatomia-cardio');
    });

    it('should successfully create a flashcard tag with minimal length name', async () => {
      const requestData =
        FlashcardTagTestData.VALID_CREATE_REQUESTS.MINIMAL_LENGTH;

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('ABC');
      expect(response.body.flashcardTag.slug).toBe('abc');
    });

    it('should successfully create a flashcard tag with maximum length name', async () => {
      const requestData =
        FlashcardTagTestData.VALID_CREATE_REQUESTS.MAXIMUM_LENGTH;

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('A'.repeat(200));
      expect(response.body.flashcardTag.slug.length).toBeLessThanOrEqual(50);
    });

    it('should successfully create a flashcard tag with special characters', async () => {
      const requestData =
        FlashcardTagTestData.VALID_CREATE_REQUESTS.SPECIAL_CHARS;

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('Anatomia & Fisiologia');
      expect(response.body.flashcardTag.slug).toBe('anatomia-fisiologia');
    });

    it('should auto-generate slug when not provided', async () => {
      const requestData = { name: 'Test Auto Slug Generation' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.slug).toBe('test-auto-slug-generation');
    });

    it('should trim whitespace from name', async () => {
      const requestData = { name: '  Whitespace Test  ' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: 'Whitespace Test' },
      );

      expect(response.body.flashcardTag.name).toBe('Whitespace Test');
      expect(response.body.flashcardTag.slug).toBe('whitespace-test');
    });

    it('should handle numbers in name', async () => {
      const requestData = { name: 'Test 123 Numbers' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('Test 123 Numbers');
      expect(response.body.flashcardTag.slug).toBe('test-123-numbers');
    });

    it('should handle multiple spaces in name', async () => {
      const requestData = { name: 'Multiple    Spaces    Test' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe(
        'Multiple    Spaces    Test',
      );
      expect(response.body.flashcardTag.slug).toBe('multiple-spaces-test');
    });
  });

  describe('Error Cases - Validation', () => {
    it('should return 400 for empty name', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.EMPTY_NAME;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('name');
      expect(response.body.details.name).toContain(
        'Name cannot be empty after trimming',
      );
    });

    it('should return 400 for name too short', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.TOO_SHORT;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('name');
      expect(response.body.details.name).toContain(
        'Name must be at least 3 characters long',
      );
    });

    it('should return 400 for name too long', async () => {
      const requestData = FlashcardTagTestData.INVALID_CREATE_REQUESTS.TOO_LONG;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('name');
      expect(response.body.details.name).toContain(
        'Name cannot exceed 200 characters',
      );
    });

    it('should return 400 for invalid slug with uppercase', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.INVALID_SLUG_UPPERCASE;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain(
        'Slug must contain only lowercase letters, numbers, and hyphens',
      );
    });

    it('should return 400 for invalid slug with spaces', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.INVALID_SLUG_SPACES;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain(
        'Slug must contain only lowercase letters, numbers, and hyphens',
      );
    });

    it('should return 400 for invalid slug with underscores', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.INVALID_SLUG_UNDERSCORE;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain(
        'Slug must contain only lowercase letters, numbers, and hyphens',
      );
    });

    it('should return 400 for slug too short', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.TOO_SHORT_SLUG;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain(
        'Slug must be at least 3 characters long',
      );
    });

    it('should return 400 for slug too long', async () => {
      const requestData =
        FlashcardTagTestData.INVALID_CREATE_REQUESTS.TOO_LONG_SLUG;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain(
        'Slug cannot exceed 50 characters',
      );
    });

    it('should return 400 for multiple validation errors', async () => {
      const requestData = {
        name: 'AB', // Too short
        slug: 'Invalid-SLUG', // Invalid format
      };

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
        FlashcardTagTestData.ERROR_RESPONSES.INVALID_INPUT.error,
      );

      expect(response.body.details).toHaveProperty('name');
      expect(response.body.details).toHaveProperty('slug');
    });

    it('should return 400 for missing required fields', async () => {
      const requestData = {} as any;

      const response = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        400,
      );

      expect(response.body.details).toHaveProperty('name');
    });
  });

  describe('Error Cases - Business Logic', () => {
    it('should return 409 for duplicate name', async () => {
      // First, create a tag
      const originalRequest = { name: 'Duplicate Test' };
      await testHelpers.createFlashcardTagExpectSuccess(originalRequest);

      // Then try to create another with the same name
      const duplicateRequest = { name: 'Duplicate Test' };

      const response = await testHelpers.createFlashcardTagExpectFailure(
        duplicateRequest,
        409,
        FlashcardTagTestData.ERROR_RESPONSES.DUPLICATE_TAG.error,
      );

      testHelpers.verifyErrorResponseFormat(
        response.body,
        FlashcardTagTestData.ERROR_RESPONSES.DUPLICATE_TAG.error,
        FlashcardTagTestData.ERROR_RESPONSES.DUPLICATE_TAG.message,
      );
    });

    it('should return 409 for duplicate name (case insensitive)', async () => {
      // First, create a tag
      const originalRequest = { name: 'farmacologia' };
      await testHelpers.createFlashcardTagExpectSuccess(originalRequest);

      // Then try to create another with different case
      const duplicateRequest = { name: 'FARMACOLOGIA' };

      const response = await testHelpers.createFlashcardTagExpectFailure(
        duplicateRequest,
        409,
        FlashcardTagTestData.ERROR_RESPONSES.DUPLICATE_TAG.error,
      );
    });

    it('should return 400 for duplicate custom slug', async () => {
      // First, create a tag with custom slug
      const originalRequest = {
        name: 'Original Name',
        slug: 'custom-slug',
      };
      await testHelpers.createFlashcardTagExpectSuccess(originalRequest);

      // Then try to create another with the same slug
      const duplicateRequest = {
        name: 'Different Name',
        slug: 'custom-slug',
      };

      const response = await testHelpers.createFlashcardTagExpectFailure(
        duplicateRequest,
        400,
      );

      expect(response.body.error).toBe('INVALID_INPUT');
      expect(response.body.message).toBe('Invalid input data');
      expect(response.body.details).toHaveProperty('slug');
      expect(response.body.details.slug).toContain('Slug already exists');
    });

    it('should allow same name with different slugs if custom slug provided', async () => {
      // This test verifies that we can have different entries with custom slugs
      // even if they might generate the same auto-slug
      const request1 = {
        name: 'Test Name',
        slug: 'test-name-1',
      };
      const request2 = {
        name: 'Test Name 2',
        slug: 'test-name-2',
      };

      const response1 =
        await testHelpers.createFlashcardTagExpectSuccess(request1);
      const response2 =
        await testHelpers.createFlashcardTagExpectSuccess(request2);

      expect(response1.body.flashcardTag.slug).toBe('test-name-1');
      expect(response2.body.flashcardTag.slug).toBe('test-name-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent creation requests', async () => {
      const requests = [
        { name: 'Concurrent 1' },
        { name: 'Concurrent 2' },
        { name: 'Concurrent 3' },
        { name: 'Concurrent 4' },
        { name: 'Concurrent 5' },
      ];

      const promises = requests.map((req) =>
        testHelpers.createFlashcardTagExpectSuccess(req),
      );

      const responses = await Promise.all(promises);

      // Verify all were created successfully
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.flashcardTag.name).toBe(`Concurrent ${index + 1}`);
      });
    });

    it('should handle unicode characters in name', async () => {
      const requestData = { name: 'Médico Português' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('Médico Português');
      expect(response.body.flashcardTag.slug).toBe('medico-portugues');
    });

    it('should handle emoji characters in name', async () => {
      const requestData = { name: 'Medicine 💊 Study' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('Medicine 💊 Study');
      expect(response.body.flashcardTag.slug).toBe('medicine-study');
    });

    it('should handle very long slug generation', async () => {
      const longName =
        'This is a very long flashcard tag name that should generate a very long slug';
      const requestData = { name: longName };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe(longName);
      expect(response.body.flashcardTag.slug.length).toBeLessThanOrEqual(50);
    });

    it('should handle names with only special characters', async () => {
      const requestData = { name: '!@# Test &*()' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe('!@# Test &*()');
      expect(response.body.flashcardTag.slug).toBe('test');
    });

    it('should handle names with mixed languages', async () => {
      const requestData = { name: 'English Português Italiano' };

      const response = await testHelpers.createFlashcardTagExpectSuccess(
        requestData,
        { name: requestData.name },
      );

      expect(response.body.flashcardTag.name).toBe(
        'English Português Italiano',
      );
      expect(response.body.flashcardTag.slug).toBe(
        'english-portugues-italiano',
      );
    });
  });

  describe('Response Format Validation', () => {
    it('should return 201 status code for successful creation', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return consistent response structure', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

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

    it('should return valid UUID for created tag', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

      expect(response.body.flashcardTag.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should return ISO date strings for timestamps', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

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

    it('should have createdAt and updatedAt equal for new records', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const response =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

      const { createdAt, updatedAt } = response.body.flashcardTag;

      expect(new Date(createdAt).getTime()).toBe(new Date(updatedAt).getTime());
    });
  });

  describe('Database Integration', () => {
    it('should persist created flashcard tag in database', async () => {
      const requestData = FlashcardTagTestData.VALID_CREATE_REQUESTS.SIMPLE;

      const createResponse =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);
      const createdId = createResponse.body.flashcardTag.id;

      // Verify it can be retrieved
      const getResponse =
        await testHelpers.getFlashcardTagExpectSuccess(createdId);

      expect(getResponse.body.flashcardTag.id).toBe(createdId);
      expect(getResponse.body.flashcardTag.name).toBe(requestData.name);
    });

    it('should handle database constraints properly', async () => {
      // This test ensures database constraints are working
      const requestData = { name: 'Database Test' };

      // Create first tag
      const response1 =
        await testHelpers.createFlashcardTagExpectSuccess(requestData);

      // Try to create duplicate
      const response2 = await testHelpers.createFlashcardTagExpectFailure(
        requestData,
        409,
      );

      expect(response2.body.error).toBe('DUPLICATE_FLASHCARD_TAG');
    });
  });
});
