// test/e2e/attempts/post-review-open-answer.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { AttemptTestSetup } from './shared/attempt-test-setup';
import { AttemptTestHelpers } from './shared/attempt-test-helpers';

describe('POST /attempts/answers/:id/review (E2E)', () => {
  let setup: AttemptTestSetup;
  let helpers: AttemptTestHelpers;

  beforeAll(async () => {
    setup = new AttemptTestSetup();
    await setup.init();
    helpers = new AttemptTestHelpers(setup);
  });

  afterAll(async () => {
    await setup.teardown();
  });

  beforeEach(async () => {
    await setup.setupTestData();
  });

  describe('Success Cases', () => {
    it('should successfully review open answer as correct', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'Excellent explanation of hypertension pathophysiology!',
        });
      
      // Debug response
      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('Request data:', {
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'Excellent explanation of hypertension pathophysiology!',
        });
        
        // Debug the attempt answer data
        const attemptAnswer = await setup.findAttemptAnswerById(attemptAnswerId);
        console.log('Attempt answer data:', JSON.stringify(attemptAnswer, null, 2));
        
        // Debug the attempt data
        const attempt = await setup.findAttemptById(attemptId);
        console.log('Attempt data:', JSON.stringify(attempt, null, 2));
      }
      
      expect(response.status).toBe(201);

      // Assert
      expect(response.body).toEqual({
        attemptAnswer: {
          id: attemptAnswerId,
          textAnswer: expect.any(String),
          status: 'GRADED',
          isCorrect: true,
          teacherComment: 'Excellent explanation of hypertension pathophysiology!',
          reviewerId: setup.tutorUserId,
          attemptId,
          questionId: setup.openQuestionId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        attemptStatus: {
          id: attemptId,
          status: 'GRADED',
          allOpenQuestionsReviewed: true,
        },
      });
    });

    it('should successfully review open answer as incorrect', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: false,
          teacherComment: 'Please review the pathophysiology concepts and provide more details.',
        })
        .expect(201);

      // Assert
      expect(response.body.attemptAnswer.isCorrect).toBe(false);
      expect(response.body.attemptAnswer.teacherComment).toBe('Please review the pathophysiology concepts and provide more details.');
      expect(response.body.attemptAnswer.reviewerId).toBe(setup.tutorUserId);
      expect(response.body.attemptAnswer.status).toBe('GRADED');
    });

    it('should successfully review open answer without teacher comment', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(201);

      // Assert
      expect(response.body.attemptAnswer.isCorrect).toBe(true);
      expect(response.body.attemptAnswer.teacherComment).toBeUndefined();
      expect(response.body.attemptAnswer.reviewerId).toBe(setup.tutorUserId);
    });

    it('should work with admin role reviewer', async () => {
      // Arrange
      const admin = await setup.createUser('admin');
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: admin.id,
          isCorrect: true,
          teacherComment: 'Good work!',
        })
        .expect(201);

      // Assert
      expect(response.body.attemptAnswer.reviewerId).toBe(admin.id);
      expect(response.body.attemptAnswer.isCorrect).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid attemptAnswerId format', async () => {
      await request(setup.getHttpServer())
        .post('/attempts/answers/invalid-uuid/review')
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for invalid reviewerId format', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: 'invalid-uuid',
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for missing reviewerId', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for missing isCorrect', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
        })
        .expect(400);
    });

    it('should return 400 for non-boolean isCorrect', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: 'true', // String instead of boolean
        })
        .expect(400);
    });

    it('should return 400 for empty teacherComment', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: '   ', // Empty after trim
        })
        .expect(400);
    });

    it('should return 400 for teacherComment exceeding max length', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'a'.repeat(1001), // Exceeds max length
        })
        .expect(400);
    });
  });

  describe('Business Logic Errors', () => {
    it('should return 404 for non-existent attemptAnswerId', async () => {
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${setup.getNonExistentUUID()}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(404);
    });

    it('should return 404 for non-existent reviewerId', async () => {
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.getNonExistentUUID(),
          isCorrect: true,
        })
        .expect(404);
    });

    it('should return 403 for student role reviewer', async () => {
      const student = await setup.createUser('student');
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: student.id,
          isCorrect: true,
        })
        .expect(403);
    });

    it('should return 400 for multiple choice question', async () => {
      // Arrange - Create quiz attempt with multiple choice question
      const { attemptId } = await helpers.createQuizAttemptAndSubmit();
      
      // Get the multiple choice answer ID
      const attemptAnswers = await setup.prisma.attemptAnswer.findMany({
        where: { attemptId },
      });
      const multipleChoiceAnswerId = attemptAnswers[0]?.id;
      expect(multipleChoiceAnswerId).toBeTruthy();

      // Act & Assert
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${multipleChoiceAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for attempt answer without text', async () => {
      // Arrange - Create submitted attempt first
      const { attemptId } = await helpers.createProvaAbertaAttemptAndSubmit();
      
      // Create an additional answer with empty text
      const attemptAnswerId = await setup.createAttemptAnswer(
        attemptId,
        setup.openQuestionId,
        '', // Empty text answer
        'SUBMITTED'
      );

      // Act & Assert
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for attempt answer that is already reviewed', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // First review
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'First review',
        })
        .expect(201);

      // Try to review again
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: false,
          teacherComment: 'Second review attempt',
        })
        .expect(400);
    });

    it('should return 400 for attempt that is not submitted', async () => {
      // Arrange - Create attempt in progress
      const { attemptId } = await helpers.createProvaAbertaAttemptInProgress();
      
      // Get the attempt answer that was created
      const attemptAnswers = await setup.prisma.attemptAnswer.findMany({
        where: { attemptId },
      });
      const attemptAnswerId = attemptAnswers[0].id;

      // Act & Assert
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(400);
    });

    it('should return 400 for attempt answer with status IN_PROGRESS', async () => {
      // Arrange - Create attempt in progress (not submitted)
      const { attemptId } = await helpers.createProvaAbertaAttemptInProgress();
      
      // Get the attempt answer (it will be in IN_PROGRESS status because attempt wasn't submitted)
      const attemptAnswers = await setup.prisma.attemptAnswer.findMany({
        where: { attemptId },
      });
      const attemptAnswerId = attemptAnswers[0]?.id;
      expect(attemptAnswerId).toBeTruthy();

      // Manually update the answer status to SUBMITTED to test the IN_PROGRESS validation
      await setup.prisma.attemptAnswer.update({
        where: { id: attemptAnswerId },
        data: { status: 'SUBMITTED' },
      });

      // Act & Assert - Should fail because attempt is not submitted
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial review completion for multiple open questions', async () => {
      // Arrange - Create assessment with multiple open questions
      const assessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
        numberOfQuestions: 3,
        allOpenQuestions: true,
      });

      const { attemptId } = await helpers.createAttemptAndSubmitForAssessment(
        assessment.id,
        setup.studentUserId,
        'PROVA_ABERTA'
      );

      // Get all attempt answers
      const attemptAnswers = await setup.prisma.attemptAnswer.findMany({
        where: { attemptId },
      });

      // Review only the first question
      const firstAnswerId = attemptAnswers[0]?.id;
      expect(firstAnswerId).toBeTruthy();

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${firstAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'First question reviewed',
        })
        .expect(201);

      // Assert
      expect(response.body.attemptStatus.allOpenQuestionsReviewed).toBe(false);
      expect(response.body.attemptStatus.status).toBe('SUBMITTED'); // Still submitted, not graded
    });

    it('should complete attempt grading when all open questions are reviewed', async () => {
      // Arrange - Create assessment with 2 open questions
      const assessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
        numberOfQuestions: 2,
        allOpenQuestions: true,
      });

      const { attemptId } = await helpers.createAttemptAndSubmitForAssessment(
        assessment.id,
        setup.studentUserId,
        'PROVA_ABERTA'
      );

      const attemptAnswers = await setup.prisma.attemptAnswer.findMany({
        where: { attemptId },
      });

      expect(attemptAnswers).toHaveLength(2);

      // Review first question
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswers[0]?.id}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(201);

      // Review second question (should complete the attempt)
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswers[1]?.id}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: false,
          teacherComment: 'Needs improvement',
        })
        .expect(201);

      // Assert
      expect(response.body.attemptStatus.allOpenQuestionsReviewed).toBe(true);
      expect(response.body.attemptStatus.status).toBe('GRADED'); // Now graded
    });

    it('should handle teacher comment at maximum length', async () => {
      // Arrange
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];
      const maxLengthComment = 'a'.repeat(1000);

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: maxLengthComment,
        })
        .expect(201);

      // Assert
      expect(response.body.attemptAnswer.teacherComment).toBe(maxLengthComment);
    });

    it('should preserve original attempt answer data after review', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Get original answer data
      const originalAnswer = await setup.findAttemptAnswerById(attemptAnswerId);

      // Act
      const response = await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'Review comment',
        })
        .expect(201);

      // Assert - Original data should be preserved
      expect(originalAnswer).toBeTruthy();
      expect(response.body.attemptAnswer.textAnswer).toBe(originalAnswer!.textAnswer);
      expect(response.body.attemptAnswer.attemptId).toBe(attemptId);
      expect(response.body.attemptAnswer.questionId).toBe(setup.openQuestionId);
      expect(response.body.attemptAnswer.createdAt).toBe(originalAnswer!.createdAt.toISOString());
    });
  });

  describe('Performance Tests', () => {
    it('should handle review request within acceptable time', async () => {
      // Arrange
      const { attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act & Assert
      const startTime = Date.now();
      
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete within 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Integration Tests', () => {
    it('should update attempt status correctly in database', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'Well done!',
        })
        .expect(201);

      // Assert - Check database state
      const updatedAttempt = await setup.findAttemptById(attemptId);
      const updatedAnswer = await setup.findAttemptAnswerById(attemptAnswerId);

      expect(updatedAttempt).toBeTruthy();
      expect(updatedAnswer).toBeTruthy();
      expect(updatedAttempt!.status).toBe('GRADED');
      expect(updatedAnswer!.status).toBe('GRADED');
      expect(updatedAnswer!.isCorrect).toBe(true);
      expect(updatedAnswer!.teacherComment).toBe('Well done!');
      expect(updatedAnswer!.reviewerId).toBe(setup.tutorUserId);
    });

    it('should be accessible via GET /attempts/:id/results after review', async () => {
      // Arrange
      const { attemptId, attemptAnswerIds } = await helpers.createProvaAbertaAttemptAndSubmit();
      const attemptAnswerId = attemptAnswerIds[0];

      // Act - Review the answer
      await request(setup.getHttpServer())
        .post(`/attempts/answers/${attemptAnswerId}/review`)
        .send({
          reviewerId: setup.tutorUserId,
          isCorrect: true,
          teacherComment: 'Good work!',
        })
        .expect(201);

      // Assert - Check results endpoint
      const resultsResponse = await request(setup.getHttpServer())
        .get(`/attempts/${attemptId}/results`)
        .expect(200);

      expect(resultsResponse.body.attempt.status).toBe('GRADED');
      expect(resultsResponse.body.results.reviewedQuestions).toBe(1);
      expect(resultsResponse.body.results.pendingReview).toBe(0);
    });
  });
});