// src/infra/controllers/tests/assessment/get-questions-detailed.controller.spec.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  setupAssessmentControllerTest,
  AssessmentControllerTestContext,
} from './shared/assessment-controller-test-setup';
import { AssessmentControllerTestHelpers } from './shared/assessment-controller-test-helpers';
import { AssessmentControllerTestData } from './shared/assessment-controller-test-data';

describe('AssessmentController - GET /assessments/:id/questions/detailed', () => {
  let testContext: AssessmentControllerTestContext;

  beforeEach(async () => {
    testContext = await setupAssessmentControllerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return detailed questions for a valid QUIZ assessment', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const expectedResponse =
        AssessmentControllerTestData.createQuestionsDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        expectedResponse,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(
        testContext.getQuestionsDetailedUseCase.execute,
      ).toHaveBeenCalledWith({
        assessmentId,
      });
      expect(result).toEqual(expectedResponse);
      expect(result.assessment.type).toBe('QUIZ');
      expect(result.lesson).toBeDefined();
      expect(result.arguments).toHaveLength(0);
      expect(result.questions).toHaveLength(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.totalQuestionsWithAnswers).toBe(1);
    });

    it('should return detailed questions for a SIMULADO with arguments', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const expectedResponse =
        AssessmentControllerTestData.createSimuladoDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        expectedResponse,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(result.assessment.type).toBe('SIMULADO');
      expect(result.lesson).toBeUndefined();
      expect(result.arguments).toHaveLength(1);
      expect(result.arguments[0].title).toBe('Cardiology');
      expect(result.arguments[0].questions).toHaveLength(1);
    });

    it('should return detailed questions for a PROVA_ABERTA with open questions', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const expectedResponse =
        AssessmentControllerTestData.createProvaAbertaDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        expectedResponse,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(result.assessment.type).toBe('PROVA_ABERTA');
      expect(result.assessment.passingScore).toBeUndefined();
      expect(result.questions[0].type).toBe('OPEN');
      expect(result.questions[0].options).toHaveLength(0);
      expect(result.questions[0].answer).toBeUndefined();
      expect(result.totalQuestionsWithAnswers).toBe(0);
    });

    it('should handle empty assessment with no questions', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const expectedResponse =
        AssessmentControllerTestData.createEmptyAssessmentResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        expectedResponse,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(result.questions).toHaveLength(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.totalQuestionsWithAnswers).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should throw BadRequestException when assessmentId is invalid UUID', async () => {
      // Arrange
      const invalidId = AssessmentControllerTestHelpers.createInvalidUUID();
      const validationError = new InvalidInputError('Validation failed', [
        'assessmentId: Assessment ID must be a valid UUID',
      ]);

      AssessmentControllerTestHelpers.mockUseCaseError(
        testContext.getQuestionsDetailedUseCase,
        validationError,
      );

      // Act & Assert
      await AssessmentControllerTestHelpers.expectInvalidInputError(
        () => testContext.controller.getQuestionsDetailed(invalidId),
        ['assessmentId: Assessment ID must be a valid UUID'],
      );
    });

    it('should throw BadRequestException when assessmentId is empty', async () => {
      // Arrange
      const emptyId = '';
      const validationError = new InvalidInputError('Validation failed', [
        'assessmentId: Assessment ID is required',
      ]);

      AssessmentControllerTestHelpers.mockUseCaseError(
        testContext.getQuestionsDetailedUseCase,
        validationError,
      );

      // Act & Assert
      await AssessmentControllerTestHelpers.expectInvalidInputError(
        () => testContext.controller.getQuestionsDetailed(emptyId),
        ['assessmentId: Assessment ID is required'],
      );
    });
  });

  describe('Business Logic Errors', () => {
    it('should throw NotFoundException when assessment does not exist', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const notFoundError = new AssessmentNotFoundError();

      AssessmentControllerTestHelpers.mockUseCaseError(
        testContext.getQuestionsDetailedUseCase,
        notFoundError,
      );

      // Act & Assert
      await AssessmentControllerTestHelpers.expectAssessmentNotFoundError(() =>
        testContext.controller.getQuestionsDetailed(assessmentId),
      );
    });
  });

  describe('Infrastructure Errors', () => {
    it('should throw InternalServerErrorException when repository fails', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const repositoryError = new RepositoryError('Failed to fetch questions');

      AssessmentControllerTestHelpers.mockUseCaseError(
        testContext.getQuestionsDetailedUseCase,
        repositoryError,
      );

      // Act & Assert
      await AssessmentControllerTestHelpers.expectRepositoryError(
        () => testContext.controller.getQuestionsDetailed(assessmentId),
        'Failed to fetch questions',
      );
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const unexpectedError = new Error('Unexpected database error');

      AssessmentControllerTestHelpers.mockUseCaseUnexpectedError(
        testContext.getQuestionsDetailedUseCase,
        unexpectedError,
      );

      // Act & Assert
      await expect(
        testContext.controller.getQuestionsDetailed(assessmentId),
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle assessment with lesson but lesson fetch failed', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const response =
        AssessmentControllerTestData.createQuestionsDetailedResponse();
      response.lesson = undefined; // Lesson fetch failed but assessment continues

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        response,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(result.assessment.lessonId).toBeDefined();
      expect(result.lesson).toBeUndefined();
    });

    it('should handle questions with multilingual translations', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const response =
        AssessmentControllerTestData.createQuestionsDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        response,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      const answer = result.questions[0].answer;
      expect(answer?.translations).toHaveLength(2);
      expect(answer?.translations.find((t) => t.locale === 'pt')).toBeDefined();
      expect(answer?.translations.find((t) => t.locale === 'it')).toBeDefined();
    });

    it('should return all question details including timestamps', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const response =
        AssessmentControllerTestData.createQuestionsDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        response,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      const question = result.questions[0];
      expect(question.createdAt).toBeDefined();
      expect(question.updatedAt).toBeDefined();
      expect(question.options[0].createdAt).toBeDefined();
      expect(question.options[0].updatedAt).toBeDefined();
    });
  });

  describe('Performance and Behavior', () => {
    it('should call use case exactly once per request', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const response =
        AssessmentControllerTestData.createQuestionsDetailedResponse();

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        response,
      );

      // Act
      await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(
        testContext.getQuestionsDetailedUseCase.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('should not modify the response from use case', async () => {
      // Arrange
      const assessmentId = AssessmentControllerTestHelpers.createValidUUID();
      const originalResponse =
        AssessmentControllerTestData.createQuestionsDetailedResponse();
      const responseCopy = JSON.parse(JSON.stringify(originalResponse));

      AssessmentControllerTestHelpers.mockUseCaseSuccess(
        testContext.getQuestionsDetailedUseCase,
        originalResponse,
      );

      // Act
      const result =
        await testContext.controller.getQuestionsDetailed(assessmentId);

      // Assert
      expect(JSON.stringify(result)).toBe(JSON.stringify(responseCopy));
    });
  });
});
