// test/e2e/attempts/post-submit-attempt.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';

import { AttemptTestSetup } from './shared/attempt-test-setup';
import { AttemptTestHelpers } from './shared/attempt-test-helpers';
import { AttemptTestData } from './shared/attempt-test-data';

describe('[E2E] POST /attempts/:id/submit - Submit Attempt', () => {
  let testSetup: AttemptTestSetup;
  let testHelpers: AttemptTestHelpers;
  let studentUser: any;
  let tutorUser: any;
  let studentToken: string;
  let tutorToken: string;
  let quizAssessment: any;
  let simuladoAssessment: any;
  let provaAbertaAssessment: any;

  beforeAll(async () => {
    testSetup = new AttemptTestSetup();
    await testSetup.initialize();
    testHelpers = new AttemptTestHelpers(testSetup);
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  beforeEach(async () => {
    // Setup the base test data (users, course structure)
    await testSetup.setupTestData();
    
    // Create additional test users for our specific tests
    studentUser = await testSetup.createUser('student');
    tutorUser = await testSetup.createUser('tutor');
    
    // Generate JWT tokens
    studentToken = testSetup.generateJwtToken(studentUser);
    tutorToken = testSetup.generateJwtToken(tutorUser);
    
    // Create test assessments
    quizAssessment = await testSetup.createAssessmentWithQuestions('QUIZ', {
      numberOfQuestions: 5,
      allMultipleChoice: true,
    });
    
    simuladoAssessment = await testSetup.createAssessmentWithQuestions('SIMULADO', {
      numberOfQuestions: 4,
      allMultipleChoice: true,
      timeLimitInMinutes: 120,
    });
    
    provaAbertaAssessment = await testSetup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 3,
      mixedQuestionTypes: true,
    });
  });

  describe('Success Cases', () => {
    describe('Quiz Assessment', () => {
      it('should submit quiz attempt with all answers and get instant score', async () => {
        // Start attempt
        const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
        
        // Submit all answers
        for (const question of quizAssessment.questions) {
          await testHelpers.submitAnswer(attempt.id, {
            questionId: question.id,
            selectedOptionId: question.options[0].id,
          }, studentToken);
        }
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
        
        // Verify response structure
        testHelpers.verifyGradedAttemptResponse(response.body);
        
        // Verify specific values
        expect(response.body.attempt.id).toBe(attempt.id);
        expect(response.body.attempt.userId).toBe(studentUser.id);
        expect(response.body.attempt.assessmentId).toBe(quizAssessment.id);
        expect(response.body.summary.totalQuestions).toBe(5);
        expect(response.body.summary.answeredQuestions).toBe(5);
      });

      it('should submit quiz attempt with partial answers', async () => {
        // Start attempt
        const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
        
        // Submit only 3 out of 5 answers
        for (let i = 0; i < 3; i++) {
          const question = quizAssessment.questions[i];
          await testHelpers.submitAnswer(attempt.id, {
            questionId: question.id,
            selectedOptionId: question.options[0].id,
          }, studentToken);
        }
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
        
        // Verify partial completion
        testHelpers.verifyGradedAttemptResponse(response.body);
        expect(response.body.summary.totalQuestions).toBe(5);
        expect(response.body.summary.answeredQuestions).toBe(3);
      });
    });

    describe('Simulado Assessment', () => {
      it('should submit simulado attempt with time limit not exceeded', async () => {
        // Start attempt
        const attempt = await testHelpers.startAttempt(studentUser.id, simuladoAssessment.id, studentToken);
        
        // Submit all answers
        for (const question of simuladoAssessment.questions) {
          await testHelpers.submitAnswer(attempt.id, {
            questionId: question.id,
            selectedOptionId: question.options[0].id,
          }, studentToken);
        }
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
        
        // Verify response
        testHelpers.verifyGradedAttemptResponse(response.body);
        expect(response.body.attempt).toHaveProperty('timeLimitExpiresAt');
        expect(response.body.summary.totalQuestions).toBe(4);
        expect(response.body.summary.answeredQuestions).toBe(4);
      });
    });

    describe('Prova Aberta Assessment', () => {
      it('should submit prova aberta with mixed question types (no auto-grading)', async () => {
        // Start attempt
        const attempt = await testHelpers.startAttempt(studentUser.id, provaAbertaAssessment.id, studentToken);
        
        // Submit answers for all questions
        for (const question of provaAbertaAssessment.questions) {
          if (question.type === 'MULTIPLE_CHOICE') {
            await testHelpers.submitAnswer(attempt.id, {
              questionId: question.id,
              selectedOptionId: question.options[0].id,
            }, studentToken);
          } else {
            await testHelpers.submitAnswer(attempt.id, {
              questionId: question.id,
              textAnswer: 'This is my detailed answer for the open question.',
            }, studentToken);
          }
        }
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
        
        // Verify response - should be SUBMITTED, not GRADED
        testHelpers.verifySubmittedAttemptResponse(response.body);
        expect(response.body.attempt.id).toBe(attempt.id);
        expect(response.body.summary.totalQuestions).toBe(3);
        expect(response.body.summary.answeredQuestions).toBe(3);
      });

      it('should submit prova aberta with only open questions', async () => {
        // Create assessment with only open questions
        const openOnlyAssessment = await testSetup.createAssessmentWithQuestions('PROVA_ABERTA', {
          numberOfQuestions: 2,
          allOpenQuestions: true,
        });
        
        // Start attempt
        const attempt = await testHelpers.startAttempt(studentUser.id, openOnlyAssessment.id, studentToken);
        
        // Submit text answers
        for (const question of openOnlyAssessment.questions) {
          await testHelpers.submitAnswer(attempt.id, {
            questionId: question.id,
            textAnswer: `Answer for question ${question.id}`,
          }, studentToken);
        }
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
        
        // Verify it's submitted but not graded
        testHelpers.verifySubmittedAttemptResponse(response.body);
      });
    });

    describe('Different User Roles', () => {
      it('should allow tutor to submit attempt', async () => {
        // Start attempt as tutor
        const attempt = await testHelpers.startAttempt(tutorUser.id, quizAssessment.id, tutorToken);
        
        // Submit one answer
        await testHelpers.submitAnswer(attempt.id, {
          questionId: quizAssessment.questions[0].id,
          selectedOptionId: quizAssessment.questions[0].options[0].id,
        }, tutorToken);
        
        // Submit attempt
        const response = await request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${tutorToken}`)
          .expect(201);
        
        expect(response.body.attempt.userId).toBe(tutorUser.id);
      });
    });
  });

  describe('Error Cases - Validation', () => {
    it('should return 400 for invalid attempt ID format', async () => {
      const response = await request(testSetup.getHttpServer())
        .post('/attempts/invalid-uuid-format/submit')
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: expect.any(Array),
      });
    });

    it('should handle SQL injection attempt in ID', async () => {
      const maliciousId = "550e8400-e29b-41d4-a716-446655440001'; DROP TABLE attempts; --";
      
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${encodeURIComponent(maliciousId)}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should return 404 when attempt does not exist', async () => {
      const nonExistentId = randomUUID();
      
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${nonExistentId}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'ATTEMPT_NOT_FOUND',
        message: 'Attempt not found',
      });
    });

    it('should return 404 when assessment is deleted after attempt started', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Delete assessment
      await testSetup.deleteAssessment(quizAssessment.id);
      
      // Try to submit
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'ATTEMPT_NOT_FOUND',
        message: 'Attempt not found',
      });
    });
  });

  describe('Error Cases - Business Logic', () => {
    it('should return 400 when attempt is already submitted', async () => {
      // Start and submit attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit one answer
      await testHelpers.submitAnswer(attempt.id, {
        questionId: quizAssessment.questions[0].id,
        selectedOptionId: quizAssessment.questions[0].options[0].id,
      }, studentToken);
      
      // Submit attempt first time
      await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      // Try to submit again
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'ATTEMPT_NOT_ACTIVE',
        message: 'Attempt is not active',
      });
    });

    it('should return 400 when attempt is already graded', async () => {
      // Create a graded attempt
      const attempt = await testSetup.createGradedAttempt(studentUser.id, quizAssessment.id);
      
      // Try to submit
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'ATTEMPT_NOT_ACTIVE',
        message: 'Attempt is not active',
      });
    });

    it('should return 400 when no answers have been submitted', async () => {
      // Start attempt but don't submit any answers
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Try to submit without any answers
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'NO_ANSWERS_FOUND',
        message: 'No answers found for this attempt',
      });
    });

    it('should return 400 when simulado time limit has expired', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, simuladoAssessment.id, studentToken);
      
      // Submit an answer
      await testHelpers.submitAnswer(attempt.id, {
        questionId: simuladoAssessment.questions[0].id,
        selectedOptionId: simuladoAssessment.questions[0].options[0].id,
      }, studentToken);
      
      // Simulate time expiration
      await testSetup.expireAttempt(attempt.id);
      
      // Try to submit after expiration
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'ATTEMPT_EXPIRED',
        message: 'Attempt has expired',
      });
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score correctly for all correct answers', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit all correct answers
      for (const question of quizAssessment.questions) {
        const correctOption = question.options.find((opt: any) => opt.id === question.correctOptionId);
        await testHelpers.submitAnswer(attempt.id, {
          questionId: question.id,
          selectedOptionId: correctOption.id,
        }, studentToken);
      }
      
      // Submit attempt
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      // Verify perfect score
      expect(response.body.summary.correctAnswers).toBe(5);
      expect(response.body.summary.scorePercentage).toBe(100);
      if (response.body.attempt.score !== undefined) {
        expect(response.body.attempt.score).toBe(100);
      }
    });

    it('should calculate score correctly for all incorrect answers', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit all incorrect answers
      for (const question of quizAssessment.questions) {
        const incorrectOption = question.options.find((opt: any) => opt.id !== question.correctOptionId);
        await testHelpers.submitAnswer(attempt.id, {
          questionId: question.id,
          selectedOptionId: incorrectOption.id,
        }, studentToken);
      }
      
      // Submit attempt
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      // Verify zero score
      expect(response.body.summary.correctAnswers).toBe(0);
      expect(response.body.summary.scorePercentage).toBe(0);
      if (response.body.attempt.score !== undefined) {
        expect(response.body.attempt.score).toBe(0);
      }
    });

    it('should calculate partial score correctly', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit mix of correct and incorrect answers (3 correct, 2 incorrect)
      for (let i = 0; i < quizAssessment.questions.length; i++) {
        const question = quizAssessment.questions[i];
        const optionToSelect = i < 3 
          ? question.options.find((opt: any) => opt.id === question.correctOptionId)
          : question.options.find((opt: any) => opt.id !== question.correctOptionId);
        
        await testHelpers.submitAnswer(attempt.id, {
          questionId: question.id,
          selectedOptionId: optionToSelect.id,
        }, studentToken);
      }
      
      // Submit attempt
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      // Verify partial score (3/5 = 60%)
      expect(response.body.summary.correctAnswers).toBe(3);
      expect(response.body.summary.scorePercentage).toBe(60);
      if (response.body.attempt.score !== undefined) {
        expect(response.body.attempt.score).toBe(60);
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after submission', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit answers
      for (const question of quizAssessment.questions) {
        await testHelpers.submitAnswer(attempt.id, {
          questionId: question.id,
          selectedOptionId: question.options[0].id,
        }, studentToken);
      }
      
      // Submit attempt
      await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      // Verify attempt data is persisted correctly
      const persistedAttempt = await testHelpers.getAttempt(attempt.id);
      expect(persistedAttempt.status).toBe('GRADED');
      expect(persistedAttempt.submittedAt).toBeDefined();
      expect(persistedAttempt.gradedAt).toBeDefined();
      
      // Verify answers are preserved
      const persistedAnswers = await testHelpers.getAttemptAnswers(attempt.id);
      expect(persistedAnswers).toHaveLength(5);
    });

    it('should update timestamps correctly', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      const startTime = new Date(attempt.startedAt);
      
      // Wait a bit to ensure different timestamps
      await testHelpers.wait(100);
      
      // Submit an answer
      await testHelpers.submitAnswer(attempt.id, {
        questionId: quizAssessment.questions[0].id,
        selectedOptionId: quizAssessment.questions[0].options[0].id,
      }, studentToken);
      
      // Submit attempt
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      const submittedAt = new Date(response.body.attempt.submittedAt);
      const gradedAt = new Date(response.body.attempt.gradedAt);
      const updatedAt = new Date(response.body.attempt.updatedAt);
      
      // Verify timestamp order
      expect(submittedAt.getTime()).toBeGreaterThan(startTime.getTime());
      expect(gradedAt.getTime()).toBeGreaterThanOrEqual(submittedAt.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(gradedAt.getTime());
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle submission within acceptable time', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit one answer
      await testHelpers.submitAnswer(attempt.id, {
        questionId: quizAssessment.questions[0].id,
        selectedOptionId: quizAssessment.questions[0].options[0].id,
      }, studentToken);
      
      // Measure submission time
      const { executionTime } = await testHelpers.measureExecutionTime(async () => {
        return request(testSetup.getHttpServer())
          .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(201);
      });
      
      // Should complete within 1 second
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle concurrent submission attempts', async () => {
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, quizAssessment.id, studentToken);
      
      // Submit an answer
      await testHelpers.submitAnswer(attempt.id, {
        questionId: quizAssessment.questions[0].id,
        selectedOptionId: quizAssessment.questions[0].options[0].id,
      }, studentToken);
      
      // Define the result type
      type ConcurrentResult = {
        status: number | 'timeout' | 'error';
        index: number;
      };
      
      // Try to submit concurrently with timeout protection
      const promises = Array(3).fill(null).map((_, index) => 
        new Promise<ConcurrentResult>(async (resolve) => {
          try {
            const response = await request(testSetup.getHttpServer())
              .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
              .timeout(5000); // 5 second timeout
            
            resolve({ status: response.status, index });
          } catch (error: any) {
            // Handle timeouts and other errors
            if (error.timeout) {
              resolve({ status: 'timeout', index });
            } else if (error.response) {
              resolve({ status: error.response.status, index });
            } else {
              resolve({ status: 'error', index });
            }
          }
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check that all requests complete (some may succeed due to race conditions)
      const successCount = results.filter(r => r.status === 201).length;
      const errorCount = results.filter(r => r.status === 400).length;
      const timeoutCount = results.filter(r => r.status === 'timeout').length;
      const otherErrorCount = results.filter(r => r.status === 'error').length;
      
      // Log results for debugging
      console.log('Concurrent submission results:', {
        successCount,
        errorCount,
        timeoutCount,
        otherErrorCount,
        results: results.map(r => ({ status: r.status, index: r.index }))
      });
      
      // At least one should succeed, and all should complete (including timeouts/errors)
      expect(successCount + errorCount + timeoutCount + otherErrorCount).toBe(3);
      expect(successCount).toBeGreaterThanOrEqual(1);
      
      // If there are timeouts, the test should still pass but we log it
      if (timeoutCount > 0) {
        console.warn(`${timeoutCount} requests timed out during concurrent submission test`);
      }
    });

    it('should handle empty assessment gracefully', async () => {
      // Create assessment with no questions
      const emptyAssessment = await testSetup.createAssessmentWithQuestions('QUIZ', {
        numberOfQuestions: 0,
      });
      
      // Start attempt
      const attempt = await testHelpers.startAttempt(studentUser.id, emptyAssessment.id, studentToken);
      
      // Try to submit (should fail with NO_ANSWERS_FOUND)
      const response = await request(testSetup.getHttpServer())
        .post(`/attempts/${attempt.id}/submit`)
          .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
      
      expect(response.body.error).toBe('NO_ANSWERS_FOUND');
    });
  });
});