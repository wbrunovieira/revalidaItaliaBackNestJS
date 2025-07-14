// test/e2e/attempts/shared/attempt-test-helpers.ts
import request, { Response } from 'supertest';
import { expect } from 'vitest';

export interface StartAttemptRequest {
  userId: string;
  assessmentId: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export class AttemptTestHelpers {
  constructor(private readonly testSetup: any) {}

  /**
   * Get the app instance for HTTP requests
   */
  private getApp() {
    return this.testSetup.app || this.testSetup;
  }

  /**
   * Get the prisma service
   */
  private getPrisma() {
    return this.testSetup.prisma;
  }

  /**
   * Start an attempt
   */
  async startAttempt(userId: string, assessmentId: string): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send({ userId, assessmentId })
      .expect(201);

    return response.body.attempt;
  }

  /**
   * Submit an answer to an attempt
   */
  async submitAnswer(
    attemptId: string,
    data: SubmitAnswerRequest,
  ): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post(`/attempts/${attemptId}/answers`)
      .send(data)
      .expect(201);

    return response.body.attemptAnswer;
  }

  /**
   * Get attempt by ID
   */
  async getAttempt(attemptId: string): Promise<any> {
    const prisma = this.getPrisma();
    return await prisma.attempt.findUnique({
      where: { id: attemptId },
    });
  }

  /**
   * Get attempt answers
   */
  async getAttemptAnswers(attemptId: string): Promise<any[]> {
    const prisma = this.getPrisma();
    return await prisma.attemptAnswer.findMany({
      where: { attemptId },
    });
  }

  /**
   * Submit multiple answers
   */
  async submitMultipleAnswers(
    attemptId: string,
    answers: SubmitAnswerRequest[],
  ): Promise<void> {
    for (const answer of answers) {
      await this.submitAnswer(attemptId, answer);
    }
  }

  /**
   * Submit all answers for an assessment
   */
  async submitAllAnswers(attemptId: string, questions: any[]): Promise<void> {
    for (const question of questions) {
      if (question.type === 'MULTIPLE_CHOICE') {
        await this.submitAnswer(attemptId, {
          questionId: question.id,
          selectedOptionId: question.options[0].id,
        });
      } else {
        await this.submitAnswer(attemptId, {
          questionId: question.id,
          textAnswer: 'Test answer for open question',
        });
      }
    }
  }

  /**
   * Make a raw request to start an attempt (for error testing)
   */
  async makeStartAttemptRequest(data: any): Promise<Response> {
    return request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send(data);
  }

  /**
   * Make a raw request to submit an attempt (for error testing)
   */
  async makeSubmitAttemptRequest(attemptId: string): Promise<Response> {
    return request(this.getApp().getHttpServer()).post(
      `/attempts/${attemptId}/submit`,
    );
  }

  /**
   * Verify attempt response format
   */
  verifyAttemptResponseFormat(attempt: any): void {
    expect(attempt).toHaveProperty('id');
    expect(attempt).toHaveProperty('status');
    expect(attempt).toHaveProperty('startedAt');
    expect(attempt).toHaveProperty('userId');
    expect(attempt).toHaveProperty('assessmentId');
    expect(attempt).toHaveProperty('createdAt');
    expect(attempt).toHaveProperty('updatedAt');

    // Verify data types
    expect(typeof attempt.id).toBe('string');
    expect(typeof attempt.status).toBe('string');
    expect(typeof attempt.startedAt).toBe('string');
    expect(typeof attempt.userId).toBe('string');
    expect(typeof attempt.assessmentId).toBe('string');
    expect(typeof attempt.createdAt).toBe('string');
    expect(typeof attempt.updatedAt).toBe('string');

    // Verify UUID format for IDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(attempt.id).toMatch(uuidRegex);
    expect(attempt.userId).toMatch(uuidRegex);
    expect(attempt.assessmentId).toMatch(uuidRegex);
  }

  /**
   * Verify submit attempt response format
   */
  verifySubmitAttemptResponseFormat(response: any): void {
    expect(response).toHaveProperty('attempt');
    expect(response).toHaveProperty('summary');

    // Verify attempt structure
    const attempt = response.attempt;
    this.verifyAttemptResponseFormat(attempt);
    expect(attempt).toHaveProperty('submittedAt');
    expect(typeof attempt.submittedAt).toBe('string');

    // Verify summary structure
    const summary = response.summary;
    expect(summary).toHaveProperty('totalQuestions');
    expect(summary).toHaveProperty('answeredQuestions');
    expect(typeof summary.totalQuestions).toBe('number');
    expect(typeof summary.answeredQuestions).toBe('number');
  }

  /**
   * Verify graded attempt response
   */
  verifyGradedAttemptResponse(response: any): void {
    this.verifySubmitAttemptResponseFormat(response);

    const attempt = response.attempt;
    expect(attempt.status).toBe('GRADED');
    expect(attempt).toHaveProperty('gradedAt');
    expect(typeof attempt.gradedAt).toBe('string');

    const summary = response.summary;
    expect(summary).toHaveProperty('correctAnswers');
    expect(summary).toHaveProperty('scorePercentage');
    expect(typeof summary.correctAnswers).toBe('number');
    expect(typeof summary.scorePercentage).toBe('number');

    // Score might be in summary instead of attempt
    if (response.attempt.score !== undefined) {
      expect(typeof response.attempt.score).toBe('number');
    }
  }

  /**
   * Verify submitted (not graded) attempt response
   */
  verifySubmittedAttemptResponse(response: any): void {
    this.verifySubmitAttemptResponseFormat(response);

    const attempt = response.attempt;
    expect(attempt.status).toBe('SUBMITTED');
    expect(attempt.score).toBeUndefined();
    expect(attempt.gradedAt).toBeNull();

    const summary = response.summary;
    expect(summary.correctAnswers).toBeUndefined();
    expect(summary.scorePercentage).toBeUndefined();
  }

  /**
   * Measure execution time
   */
  async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
    result: T;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();

    return {
      result,
      executionTime: endTime - startTime,
    };
  }

  /**
   * Test concurrent requests
   */
  async testConcurrentRequests<T>(
    fn: () => Promise<T>,
    count: number,
  ): Promise<T[]> {
    const promises = Array.from({ length: count }, fn);
    return await Promise.all(promises);
  }

  /**
   * Wait for a specified time
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Legacy methods for compatibility with existing tests

  /**
   * Start attempt and expect success (201)
   */
  async startAttemptExpectSuccess(data: StartAttemptRequest): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send(data)
      .expect(201);

    return response;
  }

  /**
   * Start attempt and expect validation error (400)
   */
  async startAttemptExpectValidationError(data: any): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send(data)
      .expect(400);

    return response;
  }

  /**
   * Start attempt and expect not found error (404)
   */
  async startAttemptExpectNotFound(
    data: StartAttemptRequest,
    expectedError: string,
  ): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send(data)
      .expect(404);

    expect(response.body).toHaveProperty('error', expectedError);
    return response;
  }

  /**
   * Start attempt and expect conflict error (409)
   */
  async startAttemptExpectConflict(data: StartAttemptRequest): Promise<any> {
    const response = await request(this.getApp().getHttpServer())
      .post('/attempts/start')
      .send(data)
      .expect(409);

    expect(response.body).toHaveProperty('error', 'ATTEMPT_ALREADY_ACTIVE');
    return response;
  }

  /**
   * Create valid start attempt request
   */
  createValidStartAttemptRequest(
    userId?: string,
    assessmentId?: string,
  ): StartAttemptRequest {
    return {
      userId:
        userId ||
        this.testSetup.studentUserId ||
        '550e8400-e29b-41d4-a716-446655440001',
      assessmentId:
        assessmentId ||
        this.testSetup.quizAssessmentId ||
        '550e8400-e29b-41d4-a716-446655440002',
    };
  }

  /**
   * Wait for database operations
   */
  async waitForDatabase(ms = 100): Promise<void> {
    await this.wait(ms);
  }

  /**
   * Verify start attempt success response format
   */
  verifyStartAttemptSuccessResponseFormat(
    responseBody: any,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): void {
    expect(responseBody).toHaveProperty('attempt');

    const attempt = responseBody.attempt;
    expect(attempt).toHaveProperty('id');
    expect(attempt).toHaveProperty('status', 'IN_PROGRESS');
    expect(attempt).toHaveProperty('startedAt');
    expect(attempt).toHaveProperty('userId', expectedUserId);
    expect(attempt).toHaveProperty('assessmentId', expectedAssessmentId);
    expect(attempt).toHaveProperty('createdAt');
    expect(attempt).toHaveProperty('updatedAt');

    // Verify data types
    expect(typeof attempt.id).toBe('string');
    expect(typeof attempt.startedAt).toBe('string');
    expect(typeof attempt.createdAt).toBe('string');
    expect(typeof attempt.updatedAt).toBe('string');

    // Verify UUID format for IDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(attempt.id).toMatch(uuidRegex);
    expect(attempt.userId).toMatch(uuidRegex);
    expect(attempt.assessmentId).toMatch(uuidRegex);

    // Verify timestamps are valid ISO strings
    expect(new Date(attempt.startedAt).toISOString()).toBe(attempt.startedAt);
    expect(new Date(attempt.createdAt).toISOString()).toBe(attempt.createdAt);
    expect(new Date(attempt.updatedAt).toISOString()).toBe(attempt.updatedAt);
  }

  /**
   * Verify start attempt response with time limit
   */
  verifyStartAttemptResponseWithTimeLimit(
    responseBody: any,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): void {
    this.verifyStartAttemptSuccessResponseFormat(
      responseBody,
      expectedUserId,
      expectedAssessmentId,
    );

    const attempt = responseBody.attempt;
    expect(attempt).toHaveProperty('timeLimitExpiresAt');
    expect(typeof attempt.timeLimitExpiresAt).toBe('string');

    // Time limit should be after start time
    const startTime = new Date(attempt.startedAt);
    const expiresTime = new Date(attempt.timeLimitExpiresAt);
    expect(expiresTime.getTime()).toBeGreaterThan(startTime.getTime());

    // Verify expires timestamp is valid ISO string
    expect(new Date(attempt.timeLimitExpiresAt).toISOString()).toBe(
      attempt.timeLimitExpiresAt,
    );
  }

  /**
   * Verify validation error response format
   */
  verifyValidationErrorResponseFormat(responseBody: any): void {
    expect(responseBody).toHaveProperty('error', 'Bad Request');
    expect(responseBody).toHaveProperty('message');
  }

  /**
   * Verify data integrity between API response and database
   */
  async verifyAttemptDataIntegrity(
    responseBody: any,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): Promise<void> {
    const attempt = responseBody.attempt;
    const prisma = this.getPrisma();
    const dbAttempt = await prisma.attempt.findUnique({
      where: { id: attempt.id },
    });

    expect(dbAttempt).toBeDefined();
    expect(dbAttempt.id).toBe(attempt.id);
    expect(dbAttempt.status).toBe(attempt.status);
    expect(dbAttempt.userId).toBe(expectedUserId);
    expect(dbAttempt.assessmentId).toBe(expectedAssessmentId);

    // Compare timestamps (API returns ISO strings, DB returns Date objects)
    expect(new Date(attempt.startedAt)).toEqual(dbAttempt.startedAt);
    expect(new Date(attempt.createdAt)).toEqual(dbAttempt.createdAt);
    expect(new Date(attempt.updatedAt)).toEqual(dbAttempt.updatedAt);

    // Compare time limit if present
    if (attempt.timeLimitExpiresAt) {
      expect(dbAttempt.timeLimitExpiresAt).toBeDefined();
      expect(new Date(attempt.timeLimitExpiresAt)).toEqual(
        dbAttempt.timeLimitExpiresAt,
      );
    } else {
      expect(dbAttempt.timeLimitExpiresAt).toBeNull();
    }
  }

  /**
   * Verify database state after operations
   */
  async verifyDatabaseState(expectedAttemptCount: number): Promise<void> {
    const prisma = this.getPrisma();
    const actualCount = await prisma.attempt.count();
    expect(actualCount).toBe(expectedAttemptCount);
  }

  /**
   * Verify attempt created in database
   */
  async verifyAttemptCreatedInDatabase(
    attemptId: string,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): Promise<void> {
    const prisma = this.getPrisma();
    const dbAttempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    expect(dbAttempt).toBeDefined();
    expect(dbAttempt.id).toBe(attemptId);
    expect(dbAttempt.userId).toBe(expectedUserId);
    expect(dbAttempt.assessmentId).toBe(expectedAssessmentId);
    expect(dbAttempt.status).toBe('IN_PROGRESS');
  }

  /**
   * Test start attempt performance
   */
  async testStartAttemptPerformance(
    description: string,
    requestData: StartAttemptRequest,
    maxExecutionTime: number,
  ): Promise<void> {
    const { executionTime } = await this.measureExecutionTime(async () => {
      return this.startAttemptExpectSuccess(requestData);
    });

    console.log(
      `${description}: ${executionTime}ms (max: ${maxExecutionTime}ms)`,
    );
    expect(executionTime).toBeLessThan(maxExecutionTime);
  }
}
