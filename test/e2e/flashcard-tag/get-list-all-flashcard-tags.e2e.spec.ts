// test/e2e/flashcard-tag/get-list-all-flashcard-tags.e2e.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlashcardTagGetTestSetup } from './shared/flashcard-tag-get-test-setup';
import { FlashcardTagTestHelpers } from './shared/flashcard-tag-test-helpers';
import { FlashcardTagTestData } from './shared/flashcard-tag-test-data';

describe('GET /flashcard-tags E2E Tests', () => {
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
    it('should successfully return all flashcard tags', async () => {
      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(5);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        5,
      );

      // Verify all tags are returned (sorted by name)
      const tags = response.body.flashcardTags;
      expect(tags[0].name).toBe('Anatomia');
      expect(tags[1].name).toBe('Anatomia & Fisiologia');
      expect(tags[2].name).toBe('Farmacologia');
      expect(tags[3].name).toBe('Fisiologia');
      expect(tags[4].name).toBe('Patologia');

      // Verify expected data from test setup
      expect(tags[0].id).toBe(testSetup.flashcardTagId2);
      expect(tags[0].slug).toBe('anatomia');
      expect(tags[1].id).toBe(testSetup.flashcardTagId5);
      expect(tags[1].slug).toBe('anatomia-fisiologia');
      expect(tags[2].id).toBe(testSetup.flashcardTagId1);
      expect(tags[2].slug).toBe('farmacologia');
    });

    it('should return empty array when no flashcard tags exist', async () => {
      // Arrange - Clean up existing data
      await testSetup.prisma.flashcardTag.deleteMany({});

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(0);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        0,
      );
      expect(response.body.flashcardTags).toEqual([]);
    });

    it('should return single flashcard tag when only one exists', async () => {
      // Arrange - Clean up and create single tag
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.create({
        data: {
          id: testSetup.flashcardTagId1,
          name: 'Única Tag',
          slug: 'unica-tag',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(1);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        1,
      );
      expect(response.body.flashcardTags[0]).toEqual({
        id: testSetup.flashcardTagId1,
        name: 'Única Tag',
        slug: 'unica-tag',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle tags with special characters', async () => {
      // Arrange - Clean up and create specific tags
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.createMany({
        data: [
          {
            id: testSetup.flashcardTagId1,
            name: 'Anatomia & Fisiologia',
            slug: 'anatomia-fisiologia',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: testSetup.flashcardTagId2,
            name: 'Médico Português',
            slug: 'medico-portugues',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(2);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        2,
      );
      expect(response.body.flashcardTags[0].name).toBe('Anatomia & Fisiologia');
      expect(response.body.flashcardTags[0].slug).toBe('anatomia-fisiologia');
      expect(response.body.flashcardTags[1].name).toBe('Médico Português');
      expect(response.body.flashcardTags[1].slug).toBe('medico-portugues');
    });

    it('should return tags sorted by name', async () => {
      // Arrange - Clean up and create tags in non-alphabetical order
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.createMany({
        data: [
          {
            id: testSetup.flashcardTagId1,
            name: 'Zootecnia',
            slug: 'zootecnia',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: testSetup.flashcardTagId2,
            name: 'Anatomia',
            slug: 'anatomia',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: testSetup.flashcardTagId3,
            name: 'Medicina',
            slug: 'medicina',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(3);

      // Assert - Should be sorted alphabetically by name
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        3,
      );
      expect(response.body.flashcardTags[0].name).toBe('Anatomia');
      expect(response.body.flashcardTags[1].name).toBe('Medicina');
      expect(response.body.flashcardTags[2].name).toBe('Zootecnia');
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data format', async () => {
      // Arrange - Clean up and create specific tag
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.create({
        data: {
          id: testSetup.flashcardTagId1,
          name: 'Test Tag',
          slug: 'test-tag',
          createdAt: new Date('2024-01-01T12:00:00.000Z'),
          updatedAt: new Date('2024-01-01T13:00:00.000Z'),
        },
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(1);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        1,
      );
      const tag = response.body.flashcardTags[0];
      expect(tag.id).toBe(testSetup.flashcardTagId1);
      expect(tag.name).toBe('Test Tag');
      expect(tag.slug).toBe('test-tag');
      expect(tag.createdAt).toBe('2024-01-01T12:00:00.000Z');
      expect(tag.updatedAt).toBe('2024-01-01T13:00:00.000Z');
    });

    it('should handle tags with different timestamps', async () => {
      // Arrange - Clean up and create tags with different timestamps
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.createMany({
        data: [
          {
            id: testSetup.flashcardTagId1,
            name: 'Tag 1',
            slug: 'tag-1',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: testSetup.flashcardTagId2,
            name: 'Tag 2',
            slug: 'tag-2',
            createdAt: new Date('2024-01-02T00:00:00.000Z'),
            updatedAt: new Date('2024-01-02T01:00:00.000Z'),
          },
        ],
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(2);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        2,
      );
      expect(response.body.flashcardTags[0].createdAt).toBe(
        '2024-01-01T00:00:00.000Z',
      );
      expect(response.body.flashcardTags[0].updatedAt).toBe(
        '2024-01-01T00:00:00.000Z',
      );
      expect(response.body.flashcardTags[1].createdAt).toBe(
        '2024-01-02T00:00:00.000Z',
      );
      expect(response.body.flashcardTags[1].updatedAt).toBe(
        '2024-01-02T01:00:00.000Z',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle tags with very long names', async () => {
      // Arrange - Clean up and create tag with long name
      await testSetup.prisma.flashcardTag.deleteMany({});
      const longName = 'A'.repeat(200);
      await testSetup.prisma.flashcardTag.create({
        data: {
          id: testSetup.flashcardTagId1,
          name: longName,
          slug: 'a'.repeat(50), // Slug truncated to 50 chars
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(1);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        1,
      );
      expect(response.body.flashcardTags[0].name).toBe(longName);
      expect(response.body.flashcardTags[0].slug).toBe('a'.repeat(50));
    });

    it('should handle tags with identical names but different slugs', async () => {
      // Arrange - Clean up and create tags with identical names
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.createMany({
        data: [
          {
            id: testSetup.flashcardTagId1,
            name: 'Duplicate Name',
            slug: 'duplicate-1',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            id: testSetup.flashcardTagId2,
            name: 'Duplicate Name',
            slug: 'duplicate-2',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
      });

      // Act
      const response = await testHelpers.listAllFlashcardTagsExpectSuccess(2);

      // Assert
      testHelpers.verifyListAllFlashcardTagsSuccessResponseFormat(
        response.body,
        2,
      );
      expect(response.body.flashcardTags[0].name).toBe('Duplicate Name');
      expect(response.body.flashcardTags[1].name).toBe('Duplicate Name');
      expect(response.body.flashcardTags[0].slug).toBe('duplicate-1');
      expect(response.body.flashcardTags[1].slug).toBe('duplicate-2');
    });
  });

  describe('Response Format', () => {
    it('should return proper HTTP headers', async () => {
      // Act
      const response = await testHelpers.listAllFlashcardTags();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('flashcardTags');
    });

    it('should handle concurrent requests correctly', async () => {
      // Arrange - Clean up and create single tag
      await testSetup.prisma.flashcardTag.deleteMany({});
      await testSetup.prisma.flashcardTag.create({
        data: {
          id: testSetup.flashcardTagId1,
          name: 'Test Tag',
          slug: 'test-tag',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      });

      // Act - Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        testHelpers.listAllFlashcardTags(),
      );
      const responses = await Promise.all(promises);

      // Assert
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.flashcardTags).toHaveLength(1);
        expect(response.body.flashcardTags[0].name).toBe('Test Tag');
      });
    });
  });
});
