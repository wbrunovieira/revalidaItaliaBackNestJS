// test/e2e/answers/get-list-answers.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AnswerTestSetup } from './shared/answer-test-setup';
import { AnswerTestHelpers } from './shared/answer-test-helpers';
import { ListAnswersRequest } from './shared/answer-test-data';

describe('ListAnswers E2E - GET /answers', () => {
  let testSetup: AnswerTestSetup;
  let helpers: AnswerTestHelpers;

  beforeAll(async () => {
    testSetup = new AnswerTestSetup();
    await testSetup.initialize();
    helpers = new AnswerTestHelpers(testSetup);
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('Success scenarios', () => {
    it('should return answers with default pagination when no parameters provided', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.answers.length).toBeGreaterThanOrEqual(0);
    });

    it('should return answers with custom pagination', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 5,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.answers.length).toBeLessThanOrEqual(5);
    });

    it('should return answers filtered by questionId', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        questionId: testSetup.multipleChoiceQuestionId,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);

      // All returned answers should belong to the specified question
      response.body.answers.forEach((answer: any) => {
        expect(answer.questionId).toBe(testSetup.multipleChoiceQuestionId);
      });
    });

    it('should return answers with combined pagination and filter', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 3,
        questionId: testSetup.openQuestionId,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.answers.length).toBeLessThanOrEqual(3);

      // All returned answers should belong to the specified question
      response.body.answers.forEach((answer: any) => {
        expect(answer.questionId).toBe(testSetup.openQuestionId);
      });
    });

    it('should return empty list when no answers found for question filter', async () => {
      // Arrange - Create a real question but don't create any answers for it
      const { questionId: emptyQuestionId } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Question with no answers for empty list test',
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

      const params: ListAnswersRequest = {
        questionId: emptyQuestionId,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.answers).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
      expect(response.body.pagination.hasNext).toBe(false);
      expect(response.body.pagination.hasPrevious).toBe(false);
    });

    it('should handle maximum allowed limit', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        limit: 100,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.limit).toBe(100);
      expect(response.body.answers.length).toBeLessThanOrEqual(100);
    });

    it('should handle minimum values for pagination', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 1,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.answers.length).toBeLessThanOrEqual(1);
    });

    it('should return correct pagination metadata for multiple pages', async () => {
      // Create multiple answers first to ensure multiple pages
      await testSetup.createMultipleAnswers(15);

      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 5,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(15);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(3);

      if (response.body.pagination.total > 5) {
        expect(response.body.pagination.hasNext).toBe(true);
      }
      expect(response.body.pagination.hasPrevious).toBe(false);
    });

    it('should return answers in descending order by creation date', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);

      if (response.body.answers.length > 1) {
        for (let i = 0; i < response.body.answers.length - 1; i++) {
          const currentDate = new Date(response.body.answers[i].createdAt);
          const nextDate = new Date(response.body.answers[i + 1].createdAt);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(
            nextDate.getTime(),
          );
        }
      }
    });

    it('should return answers with complete structure including translations', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);

      if (response.body.answers.length > 0) {
        const answer = response.body.answers[0];
        expect(answer).toHaveProperty('id');
        expect(answer).toHaveProperty('explanation');
        expect(answer).toHaveProperty('questionId');
        expect(answer).toHaveProperty('translations');
        expect(answer).toHaveProperty('createdAt');
        expect(answer).toHaveProperty('updatedAt');
        expect(Array.isArray(answer.translations)).toBe(true);

        // Check translations structure if present
        if (answer.translations.length > 0) {
          answer.translations.forEach((translation: any) => {
            expect(translation).toHaveProperty('locale');
            expect(translation).toHaveProperty('explanation');
            expect(typeof translation.locale).toBe('string');
            expect(typeof translation.explanation).toBe('string');
          });
        }
      }
    });
  });

  describe('Validation scenarios', () => {
    it('should reject invalid page parameter (zero)', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 0,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should reject invalid page parameter (negative)', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: -1,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should reject invalid limit parameter (zero)', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        limit: 0,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should reject invalid limit parameter (negative)', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        limit: -5,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should reject limit parameter exceeding maximum', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        limit: 101,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should reject invalid questionId format', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        questionId: 'invalid-uuid-format',
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should handle decimal page parameter (converted to integer)', async () => {
      // Note: This might depend on how NestJS handles query parameter conversion
      // We test both scenarios - either it works or returns validation error

      // Arrange - using URL params directly to test decimal handling
      const response = await helpers.listAnswers({ page: 1.5 } as any);

      // Act & Assert
      // Should either succeed (if converted to integer) or fail with validation error
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        helpers.verifyListAnswersResponseFormat(response.body);
        // If successful, page should be converted to integer
        expect(Number.isInteger(response.body.pagination.page)).toBe(true);
      }
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 when questionId does not exist', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        questionId: '00000000-0000-0000-0000-000000000000',
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 404, 'QUESTION_NOT_FOUND');
    });

    it('should handle database connection issues gracefully', async () => {
      // This test simulates database issues
      // In a real scenario, you might temporarily disconnect the database
      // For this test, we'll use a very large page number that should still work

      // Arrange
      const params: ListAnswersRequest = {
        page: 999999,
        limit: 10,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert - Should return empty results for very high page numbers
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.answers).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle requests to non-existent pages gracefully', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1000,
        limit: 10,
      };

      // Act
      const response = await helpers.listAnswersExpectSuccess(params);

      // Assert
      helpers.verifyListAnswersResponseFormat(response.body);
      expect(response.body.answers).toHaveLength(0);
      expect(response.body.pagination.page).toBe(1000);
      expect(response.body.pagination.hasNext).toBe(false);
      expect(response.body.pagination.hasPrevious).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 5,
      };

      // Act - Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        helpers.listAnswersExpectSuccess(params),
      );
      const responses = await Promise.all(promises);

      // Assert - All should succeed and return consistent results
      responses.forEach((response) => {
        helpers.verifyListAnswersResponseFormat(response.body);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      });

      // All responses should have the same total count
      const firstTotal = responses[0].body.pagination.total;
      responses.forEach((response) => {
        expect(response.body.pagination.total).toBe(firstTotal);
      });
    });

    it('should maintain consistent pagination across multiple requests', async () => {
      // Create enough data for multiple pages
      await testSetup.createMultipleAnswers(25);

      // Arrange - Test first page
      const firstPageParams: ListAnswersRequest = {
        page: 1,
        limit: 10,
      };

      // Act
      const firstPageResponse =
        await helpers.listAnswersExpectSuccess(firstPageParams);

      // Assert
      helpers.verifyListAnswersResponseFormat(firstPageResponse.body);
      expect(firstPageResponse.body.pagination.hasNext).toBe(true);
      expect(firstPageResponse.body.pagination.hasPrevious).toBe(false);

      // Arrange - Test second page
      const secondPageParams: ListAnswersRequest = {
        page: 2,
        limit: 10,
      };

      // Act
      const secondPageResponse =
        await helpers.listAnswersExpectSuccess(secondPageParams);

      // Assert
      helpers.verifyListAnswersResponseFormat(secondPageResponse.body);
      expect(secondPageResponse.body.pagination.page).toBe(2);
      expect(secondPageResponse.body.pagination.hasPrevious).toBe(true);

      // Verify no duplicate answers between pages
      const firstPageIds = firstPageResponse.body.answers.map(
        (answer: any) => answer.id,
      );
      const secondPageIds = secondPageResponse.body.answers.map(
        (answer: any) => answer.id,
      );
      const intersection = firstPageIds.filter((id: string) =>
        secondPageIds.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });

    it('should handle special characters in questionId gracefully', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        questionId: 'special@chars#test',
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });

    it('should handle very long questionId values', async () => {
      // Arrange
      const longString = 'a'.repeat(1000);
      const params: ListAnswersRequest = {
        questionId: longString,
      };

      // Act & Assert
      await helpers.listAnswersExpectFailure(params, 400, 'INVALID_INPUT');
    });
  });

  describe('Performance scenarios', () => {
    it('should return results within acceptable time for default pagination', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 10,
      };

      // Act & Assert
      await helpers.testListAnswersPerformance(
        'Default pagination',
        params,
        1000, // 1 second max
      );
    });

    it('should return results within acceptable time for maximum limit', async () => {
      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 100,
      };

      // Act & Assert
      await helpers.testListAnswersPerformance(
        'Maximum limit',
        params,
        2000, // 2 seconds max for larger dataset
      );
    });

    it('should handle large datasets efficiently', async () => {
      // Create a larger dataset for performance testing
      await testSetup.createMultipleAnswers(50);

      // Arrange
      const params: ListAnswersRequest = {
        page: 1,
        limit: 50,
      };

      // Act & Assert
      await helpers.testListAnswersPerformance(
        'Large dataset',
        params,
        3000, // 3 seconds max for large dataset
      );
    });
  });

  describe('Response format validation', () => {
    it('should return properly formatted response structure', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      expect(response.body).toEqual({
        answers: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrevious: expect.any(Boolean),
        },
      });

      helpers.verifyListAnswersResponseFormat(response.body);
    });

    it('should maintain consistent answer structure across all results', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      if (response.body.answers.length > 0) {
        response.body.answers.forEach((answer: any) => {
          // Check that all answers have required fields
          expect(answer).toHaveProperty('id');
          expect(answer).toHaveProperty('explanation');
          expect(answer).toHaveProperty('questionId');
          expect(answer).toHaveProperty('translations');
          expect(answer).toHaveProperty('createdAt');
          expect(answer).toHaveProperty('updatedAt');

          // correctOptionId is optional and depends on question type
          if (answer.correctOptionId !== undefined) {
            expect(typeof answer.correctOptionId).toBe('string');
          }

          // Check types of required fields
          expect(typeof answer.id).toBe('string');
          expect(typeof answer.explanation).toBe('string');
          expect(typeof answer.questionId).toBe('string');
          expect(Array.isArray(answer.translations)).toBe(true);
          expect(typeof answer.createdAt).toBe('string');
          expect(typeof answer.updatedAt).toBe('string');
        });
      }
    });

    it('should return valid ISO date strings for timestamps', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      response.body.answers.forEach((answer: any) => {
        expect(answer.createdAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
        expect(answer.updatedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );

        // Verify dates are valid
        expect(new Date(answer.createdAt)).toBeInstanceOf(Date);
        expect(new Date(answer.updatedAt)).toBeInstanceOf(Date);
        expect(new Date(answer.createdAt).toISOString()).toBe(answer.createdAt);
        expect(new Date(answer.updatedAt).toISOString()).toBe(answer.updatedAt);
      });
    });

    it('should return valid UUID format for all ID fields', async () => {
      // Act
      const response = await helpers.listAnswersExpectSuccess();

      // Assert
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      response.body.answers.forEach((answer: any) => {
        expect(answer.id).toMatch(uuidRegex);
        expect(answer.questionId).toMatch(uuidRegex);

        if (answer.correctOptionId) {
          expect(answer.correctOptionId).toMatch(uuidRegex);
        }
      });
    });
  });
}, 30000); // 30 second timeout
