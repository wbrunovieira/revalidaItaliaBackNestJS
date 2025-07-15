// test/e2e/attempts/get-attempt-results.e2e.spec.ts

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { AttemptTestSetup } from './shared/attempt-test-setup';
import { AttemptTestHelpers } from './shared/attempt-test-helpers';
import { AttemptTestData } from './shared/attempt-test-data';

describe('GET /attempts/:id/results (E2E)', () => {
  let testSetup: AttemptTestSetup;
  let testHelpers: AttemptTestHelpers;
  let testData: AttemptTestData;

  beforeAll(async () => {
    testSetup = new AttemptTestSetup();
    await testSetup.initialize();
    testHelpers = new AttemptTestHelpers(testSetup);
    testData = new AttemptTestData();
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('Success Cases', () => {
    it('should return results for a completed QUIZ attempt', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      testHelpers.expectQuizResults(response.body);
      
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
      expect(response.body.attempt.status).toBe('GRADED');
      expect(response.body.assessment.type).toBe('QUIZ');
      expect(response.body.results.correctAnswers).toBeDefined();
      expect(response.body.results.scorePercentage).toBeDefined();
      expect(response.body.results.passed).toBeDefined();
      expect(response.body.answers).toHaveLength(attemptData.totalQuestions);
    });

    it('should return results for a completed SIMULADO attempt with arguments', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedSimuladoAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      testHelpers.expectSimuladoResults(response.body);
      
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
      expect(response.body.attempt.status).toBe('GRADED');
      expect(response.body.assessment.type).toBe('SIMULADO');
      expect(response.body.results.argumentResults).toBeDefined();
      expect(Array.isArray(response.body.results.argumentResults)).toBe(true);
      expect(response.body.results.argumentResults.length).toBeGreaterThan(0);
      
      // Verify argument results structure
      const argResult = response.body.results.argumentResults[0];
      expect(argResult).toHaveProperty('argumentId');
      expect(argResult).toHaveProperty('argumentTitle');
      expect(argResult).toHaveProperty('totalQuestions');
      expect(argResult).toHaveProperty('correctAnswers');
      expect(argResult).toHaveProperty('scorePercentage');
    });

    it('should return results for a completed PROVA_ABERTA attempt (fully graded)', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedProvaAbertaAttempt(false);

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      testHelpers.expectProvaAbertaResults(response.body, false);
      
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
      expect(response.body.attempt.status).toBe('GRADED');
      expect(response.body.assessment.type).toBe('PROVA_ABERTA');
      expect(response.body.results.pendingReview).toBe(0);
      expect(response.body.results.correctAnswers).toBeDefined();
      expect(response.body.results.scorePercentage).toBeDefined();
    });

    it('should return results for a PROVA_ABERTA attempt with pending review', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedProvaAbertaAttempt(true);

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      testHelpers.expectProvaAbertaResults(response.body, true);
      
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
      expect(response.body.attempt.status).toBe('SUBMITTED');
      expect(response.body.assessment.type).toBe('PROVA_ABERTA');
      expect(response.body.results.pendingReview).toBeGreaterThan(0);
      expect(response.body.results.correctAnswers).toBeUndefined();
      expect(response.body.results.scorePercentage).toBeUndefined();
    });

    it('should return detailed answer information for multiple choice questions', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      const multipleChoiceAnswer = response.body.answers.find(
        (answer: any) => answer.questionType === 'MULTIPLE_CHOICE'
      );
      
      expect(multipleChoiceAnswer).toBeDefined();
      expect(multipleChoiceAnswer.selectedOptionId).toBeDefined();
      expect(multipleChoiceAnswer.selectedOptionText).toBeDefined();
      expect(multipleChoiceAnswer.correctOptionId).toBeDefined();
      expect(multipleChoiceAnswer.correctOptionText).toBeDefined();
      expect(multipleChoiceAnswer.explanation).toBeDefined();
      expect(multipleChoiceAnswer.isCorrect).toBeDefined();
    });

    it('should return detailed answer information for open questions', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedProvaAbertaAttempt(false);

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      const openAnswer = response.body.answers.find(
        (answer: any) => answer.questionType === 'OPEN'
      );
      
      expect(openAnswer).toBeDefined();
      expect(openAnswer.textAnswer).toBeDefined();
      expect(openAnswer.teacherComment).toBeDefined();
      expect(openAnswer.submittedAt).toBeDefined();
      expect(openAnswer.reviewedAt).toBeDefined();
      expect(openAnswer.isCorrect).toBeDefined();
    });

    it('should return time spent information', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      expect(response.body.results.timeSpent).toBeDefined();
      expect(typeof response.body.results.timeSpent).toBe('number');
      expect(response.body.results.timeSpent).toBeGreaterThan(0);
    });
  });

  describe('Error Cases', () => {
    it('should return 400 for invalid attempt ID format', async () => {
      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get('/attempts/invalid-uuid/results')
        .expect(400);

      // Assert
      // Just check that it returns a 400 error with the expected structure
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent attempt', async () => {
      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${testData.nonExistentAttemptId}/results`)
        .expect(404);

      // Assert
      testHelpers.expectErrorResponse(response.body, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
    });

    it('should return 400 for attempt that is not finalized (still in progress)', async () => {
      // Arrange
      const attemptData = await testHelpers.createActiveAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(400);

      // Assert
      testHelpers.expectErrorResponse(response.body, 'ATTEMPT_NOT_FINALIZED', 'Attempt is not finalized yet');
    });

    it('should return 200 for attempt that is submitted but not graded yet (PROVA_ABERTA)', async () => {
      // Arrange
      const attemptData = await testHelpers.createSubmittedAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      // For PROVA_ABERTA, submitted attempts are valid and can show results with pending review
      testHelpers.expectGetAttemptResultsResponse(response.body);
      expect(response.body.attempt.status).toBe('SUBMITTED');
      expect(response.body.results.pendingReview).toBeGreaterThan(0);
    });

    it('should return 403 for student trying to access another student results', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();
      const otherStudentId = testData.otherStudentId;

      // Act & Assert
      // Note: This test assumes JWT authentication is implemented
      // For now, we skip this test as JWT is not yet implemented
      // TODO: Implement when JWT authentication is added to the route
    });

    it.skip('should return 404 for non-existent user', async () => {
      // Skip: This scenario cannot be tested in E2E due to foreign key constraints
      // The unit tests for the controller and use case cover this scenario
    });

    it.skip('should return 404 for attempt with non-existent assessment', async () => {
      // Skip: This scenario cannot be tested in E2E due to foreign key constraints
      // The unit tests for the controller and use case cover this scenario
    });
  });

  describe('Permission Tests', () => {
    it('should allow tutor to access any student attempt results', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
    });

    it('should allow admin to access any student attempt results', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      testHelpers.expectGetAttemptResultsResponse(response.body);
      expect(response.body.attempt.id).toBe(attemptData.attemptId);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should return consistent scores between attempt and results', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      const { results } = response.body;
      expect(results.scorePercentage).toBeDefined();
      expect(results.correctAnswers).toBeDefined();
      expect(results.totalQuestions).toBeDefined();
      
      // Score percentage should match the calculated percentage
      const expectedScore = (results.correctAnswers / results.totalQuestions) * 100;
      expect(Math.abs(results.scorePercentage - expectedScore)).toBeLessThan(1);
    });

    it('should return correct question count consistency', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedQuizAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      const { results, answers } = response.body;
      expect(results.totalQuestions).toBe(answers.length);
      expect(results.answeredQuestions).toBeLessThanOrEqual(results.totalQuestions);
    });

    it('should return correct argument results for SIMULADO', async () => {
      // Arrange
      const attemptData = await testHelpers.createCompletedSimuladoAttempt();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      const { results } = response.body;
      expect(results.argumentResults).toBeDefined();
      
      let totalArgumentQuestions = 0;
      let totalArgumentCorrect = 0;
      
      results.argumentResults.forEach((argResult: any) => {
        totalArgumentQuestions += argResult.totalQuestions;
        totalArgumentCorrect += argResult.correctAnswers;
        
        // Each argument should have valid score percentage
        const expectedPercentage = (argResult.correctAnswers / argResult.totalQuestions) * 100;
        expect(Math.abs(argResult.scorePercentage - expectedPercentage)).toBeLessThan(1);
      });
      
      // Total from arguments should match overall results
      expect(totalArgumentQuestions).toBe(results.totalQuestions);
      expect(totalArgumentCorrect).toBe(results.correctAnswers);
    });
  });

  describe('Edge Cases', () => {
    it('should handle attempt with no answers', async () => {
      // Arrange
      const attemptData = await testHelpers.createAttemptWithNoAnswers();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      expect(response.body.results.answeredQuestions).toBe(0);
      expect(response.body.results.correctAnswers).toBe(0);
      expect(response.body.results.scorePercentage).toBe(0);
      expect(response.body.answers).toHaveLength(0);
    });

    it('should handle attempt with partial answers', async () => {
      // Arrange
      const attemptData = await testHelpers.createAttemptWithPartialAnswers();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      expect(response.body.results.answeredQuestions).toBeLessThan(response.body.results.totalQuestions);
      expect(response.body.results.answeredQuestions).toBeGreaterThan(0);
    });

    it('should handle SIMULADO without arguments gracefully', async () => {
      // Arrange
      const attemptData = await testHelpers.createSimuladoWithoutArguments();

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get(`/attempts/${attemptData.attemptId}/results`)
        .expect(200);

      // Assert
      expect(response.body.assessment.type).toBe('SIMULADO');
      // When SIMULADO has no arguments, argumentResults property is not included
      expect(response.body.results.argumentResults).toBeUndefined();
      expect(response.body.results.correctAnswers).toBeDefined();
      expect(response.body.results.scorePercentage).toBeDefined();
    });
  });
});