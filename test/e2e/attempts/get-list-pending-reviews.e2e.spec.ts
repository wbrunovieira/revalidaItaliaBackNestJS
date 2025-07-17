// test/e2e/attempts/get-list-pending-reviews.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AttemptTestSetup } from './shared/attempt-test-setup';

describe('GET /attempts/pending-review', () => {
  let app: INestApplication;
  let setup: AttemptTestSetup;

  beforeAll(async () => {
    setup = new AttemptTestSetup();
    app = await setup.createApp();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  it('should list pending reviews for tutor user', async () => {
    // Arrange
    const { adminUser, studentUser, assessment } = await setup.createTestData();
    const tutorUser = await setup.createUser('tutor');
    
    // Create prova aberta assessment
    const provaAbertaAssessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 3,
      allOpenQuestions: true,
    });
    
    // Create attempt with open answers pending review
    const { attemptId } = await setup.createAttemptWithOpenAnswers(
      studentUser.id,
      provaAbertaAssessment.id,
      'SUBMITTED',
    );

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('attempts');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.attempts)).toBe(true);
    
    if (response.body.attempts.length > 0) {
      const pendingReview = response.body.attempts[0];
      expect(pendingReview).toHaveProperty('id');
      expect(pendingReview).toHaveProperty('status');
      expect(pendingReview).toHaveProperty('submittedAt');
      expect(pendingReview).toHaveProperty('assessment');
      expect(pendingReview).toHaveProperty('student');
      expect(pendingReview).toHaveProperty('pendingAnswers');
      expect(pendingReview).toHaveProperty('totalOpenQuestions');
      expect(pendingReview.assessment.type).toBe('PROVA_ABERTA');
      expect(pendingReview.status).toBe('SUBMITTED');
    }
  });

  it('should list pending reviews for admin user', async () => {
    // Arrange
    const { adminUser, studentUser } = await setup.createTestData();
    
    // Create prova aberta assessment
    const provaAbertaAssessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 2,
      allOpenQuestions: true,
    });
    
    // Create multiple attempts with open answers
    await setup.createAttemptWithOpenAnswers(
      studentUser.id,
      provaAbertaAssessment.id,
      'SUBMITTED',
    );
    
    const otherStudent = await setup.createUser('student');
    await setup.createAttemptWithOpenAnswers(
      otherStudent.id,
      provaAbertaAssessment.id,
      'SUBMITTED',
    );

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();
    expect(response.body.attempts.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty list when no pending reviews exist', async () => {
    // Arrange
    const { adminUser, studentUser, assessment } = await setup.createTestData();
    const tutorUser = await setup.createUser('tutor');
    
    // Create only graded attempts (no pending reviews)
    await setup.createGradedAttempt(studentUser.id, assessment.id);

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();
    expect(response.body.attempts).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  it('should handle pagination', async () => {
    // Arrange
    const { adminUser, studentUser } = await setup.createTestData();
    const tutorUser = await setup.createUser('tutor');
    
    // Create prova aberta assessment
    const provaAbertaAssessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 2,
      allOpenQuestions: true,
    });
    
    // Create multiple attempts
    for (let i = 0; i < 5; i++) {
      const student = await setup.createUser('student');
      await setup.createAttemptWithOpenAnswers(
        student.id,
        provaAbertaAssessment.id,
        'SUBMITTED',
      );
    }

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review?page=1&pageSize=3')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.pageSize).toBe(3);
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.attempts.length).toBeLessThanOrEqual(3);
  });

  it('should return 403 for student users', async () => {
    // Arrange
    const { studentUser } = await setup.createTestData();

    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(studentUser)}`)
      .expect(403);
  });

  it('should return 403 for unauthenticated requests', async () => {
    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .expect(403);
  });

  it('should only include SUBMITTED attempts with PROVA_ABERTA type', async () => {
    // Arrange
    const { adminUser, studentUser } = await setup.createTestData();
    const tutorUser = await setup.createUser('tutor');
    
    // Create different types of assessments
    const quizAssessment = await setup.createAssessmentWithQuestions('QUIZ', {
      numberOfQuestions: 2,
      allMultipleChoice: true,
    });
    
    const provaAbertaAssessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 2,
      allOpenQuestions: true,
    });
    
    // Create various attempts
    await setup.createActiveAttempt(studentUser.id, quizAssessment.id); // IN_PROGRESS - should not appear
    await setup.createAttemptForUser(studentUser.id, quizAssessment.id); // SUBMITTED but QUIZ - should not appear
    await setup.createAttemptWithOpenAnswers(
      studentUser.id,
      provaAbertaAssessment.id,
      'GRADED', // GRADED - should not appear
    );
    await setup.createAttemptWithOpenAnswers(
      studentUser.id,
      provaAbertaAssessment.id,
      'SUBMITTED', // SUBMITTED and PROVA_ABERTA - should appear
    );

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();
    
    // All returned attempts should be SUBMITTED and PROVA_ABERTA
    response.body.attempts.forEach((attempt: any) => {
      expect(attempt.status).toBe('SUBMITTED');
      expect(attempt.assessment.type).toBe('PROVA_ABERTA');
    });
  });

  it('should sort attempts by submittedAt (oldest first)', async () => {
    // Arrange
    const { adminUser } = await setup.createTestData();
    const tutorUser = await setup.createUser('tutor');
    
    // Create prova aberta assessment
    const provaAbertaAssessment = await setup.createAssessmentWithQuestions('PROVA_ABERTA', {
      numberOfQuestions: 2,
      allOpenQuestions: true,
    });
    
    // Create attempts with different submission times
    const student1 = await setup.createUser('student');
    const student2 = await setup.createUser('student');
    const student3 = await setup.createUser('student');
    
    // Wait between creating attempts to ensure different timestamps
    await setup.createAttemptWithOpenAnswers(student1.id, provaAbertaAssessment.id, 'SUBMITTED');
    await setup.wait(100);
    await setup.createAttemptWithOpenAnswers(student2.id, provaAbertaAssessment.id, 'SUBMITTED');
    await setup.wait(100);
    await setup.createAttemptWithOpenAnswers(student3.id, provaAbertaAssessment.id, 'SUBMITTED');

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts/pending-review')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();
    expect(response.body.attempts.length).toBeGreaterThanOrEqual(3);
    
    // Check that attempts are sorted by submittedAt (oldest first)
    for (let i = 1; i < response.body.attempts.length; i++) {
      const prevSubmittedAt = new Date(response.body.attempts[i - 1].submittedAt).getTime();
      const currSubmittedAt = new Date(response.body.attempts[i].submittedAt).getTime();
      expect(prevSubmittedAt).toBeLessThanOrEqual(currSubmittedAt);
    }
  });

  it('should return 400 for invalid query parameters', async () => {
    // Arrange
    const tutorUser = await setup.createUser('tutor');

    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts/pending-review?page=invalid')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(400);
  });

  it('should return 400 for negative page number', async () => {
    // Arrange
    const tutorUser = await setup.createUser('tutor');

    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts/pending-review?page=-1')
      .set('Authorization', `Bearer ${setup.generateJwtToken(tutorUser)}`)
      .expect(400);
  });
});