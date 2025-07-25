// test/e2e/attempts/get-list-attempts.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AttemptTestSetup } from './shared/attempt-test-setup';

describe('GET /attempts', () => {
  let app: INestApplication;
  let setup: AttemptTestSetup;

  beforeAll(async () => {
    setup = new AttemptTestSetup();
    app = await setup.createApp();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  it('should list attempts for admin user', async () => {
    // Arrange
    const { adminUser, studentUser, assessment, attempt } =
      await setup.createTestData();

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('attempts');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.attempts)).toBe(true);

    if (response.body.attempts.length > 0) {
      const attemptResponse = response.body.attempts[0];
      expect(attemptResponse).toHaveProperty('id');
      expect(attemptResponse).toHaveProperty('status');
      expect(attemptResponse).toHaveProperty('assessment');
      expect(attemptResponse).toHaveProperty('student');
      expect(attemptResponse.assessment).toHaveProperty('title');
      expect(attemptResponse.student).toHaveProperty('name');
    }
  });

  it('should list only own attempts for student user', async () => {
    // Arrange
    const { studentUser, otherStudentUser, assessment } =
      await setup.createTestData();

    // Create attempts for both students
    await setup.createAttemptForUser(studentUser.id, assessment.id);
    await setup.createAttemptForUser(otherStudentUser.id, assessment.id);

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts')
      .set('Authorization', `Bearer ${setup.generateJwtToken(studentUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();

    // All attempts should belong to the student user
    response.body.attempts.forEach((attempt: any) => {
      expect(attempt.identityId).toBe(studentUser.id);
    });
  });

  it('should filter attempts by status', async () => {
    // Arrange
    const { adminUser, studentUser, assessment } = await setup.createTestData();

    // Create attempts with different statuses
    await setup.createAttemptWithStatus(
      studentUser.id,
      assessment.id,
      'IN_PROGRESS',
    );
    await setup.createAttemptWithStatus(
      studentUser.id,
      assessment.id,
      'SUBMITTED',
    );

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts?status=SUBMITTED')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();

    // All attempts should have SUBMITTED status
    response.body.attempts.forEach((attempt: any) => {
      expect(attempt.status).toBe('SUBMITTED');
    });
  });

  it('should filter attempts by identityId', async () => {
    // Arrange
    const { adminUser, studentUser, otherStudentUser, assessment } =
      await setup.createTestData();

    // Create attempts for both students
    await setup.createAttemptForUser(studentUser.id, assessment.id);
    await setup.createAttemptForUser(otherStudentUser.id, assessment.id);

    // Act
    const response = await request(app.getHttpServer())
      .get(`/attempts?identityId=${studentUser.id}`)
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();

    // All attempts should belong to the specified user
    response.body.attempts.forEach((attempt: any) => {
      expect(attempt.identityId).toBe(studentUser.id);
    });
  });

  it('should filter attempts by assessmentId', async () => {
    // Arrange
    const { adminUser, studentUser, assessment, otherAssessment } =
      await setup.createTestData();

    // Create attempts for both assessments
    await setup.createAttemptForUser(studentUser.id, assessment.id);
    await setup.createAttemptForUser(studentUser.id, otherAssessment.id);

    // Act
    const response = await request(app.getHttpServer())
      .get(`/attempts?assessmentId=${assessment.id}`)
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body.attempts).toBeDefined();

    // All attempts should belong to the specified assessment
    response.body.attempts.forEach((attempt: any) => {
      expect(attempt.assessmentId).toBe(assessment.id);
    });
  });

  it('should handle pagination', async () => {
    // Arrange
    const { adminUser, studentUser, assessment } = await setup.createTestData();

    // Create multiple attempts
    for (let i = 0; i < 5; i++) {
      await setup.createAttemptForUser(studentUser.id, assessment.id);
    }

    // Act
    const response = await request(app.getHttpServer())
      .get('/attempts?page=1&pageSize=3')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.pageSize).toBe(3);
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.attempts.length).toBeLessThanOrEqual(3);
  });

  it('should return 403 for unauthenticated requests', async () => {
    // Act & Assert
    await request(app.getHttpServer()).get('/attempts').expect(403);
  });

  it('should return 403 when student tries to access other user attempts', async () => {
    // Arrange
    const { studentUser, otherStudentUser } = await setup.createTestData();

    // Act & Assert
    await request(app.getHttpServer())
      .get(`/attempts?identityId=${otherStudentUser.id}`)
      .set('Authorization', `Bearer ${setup.generateJwtToken(studentUser)}`)
      .expect(403);
  });

  it('should return 400 for invalid query parameters', async () => {
    // Arrange
    const { adminUser } = await setup.createTestData();

    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts?status=INVALID_STATUS')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(400);
  });

  it('should return 400 for invalid UUID in identityId filter', async () => {
    // Arrange
    const { adminUser } = await setup.createTestData();

    // Act & Assert
    await request(app.getHttpServer())
      .get('/attempts?identityId=invalid-uuid')
      .set('Authorization', `Bearer ${setup.generateJwtToken(adminUser)}`)
      .expect(400);
  });
});
