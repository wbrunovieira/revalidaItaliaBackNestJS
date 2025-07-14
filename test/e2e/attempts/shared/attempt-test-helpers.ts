// test/e2e/attempts/shared/attempt-test-helpers.ts
import request, { Response } from 'supertest';
import { expect } from 'vitest';
import { AttemptTestSetup } from './attempt-test-setup';

export interface StartAttemptRequest {
  userId: string;
  assessmentId: string;
}

export class AttemptTestHelpers {
  constructor(private readonly testSetup: AttemptTestSetup) {}

  /**
   * Make a POST request to start an attempt
   */
  async startAttempt(data: StartAttemptRequest): Promise<Response> {
    return request(this.testSetup.getHttpServer())
      .post('/attempts/start')
      .send(data);
  }

  /**
   * Start attempt and expect success (201)
   */
  async startAttemptExpectSuccess(
    data: StartAttemptRequest,
  ): Promise<Response> {
    const res = await this.startAttempt(data);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('attempt');

    return res;
  }

  /**
   * Start attempt and expect failure with specific status code
   */
  async startAttemptExpectFailure(
    data: StartAttemptRequest,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.startAttempt(data);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Start attempt and expect validation error (400)
   */
  async startAttemptExpectValidationError(data: any): Promise<Response> {
    const res = await this.startAttempt(data);

    expect(res.status).toBe(400);
    // NestJS validation pipe returns "Bad Request" as error
    expect(res.body).toHaveProperty('error', 'Bad Request');
    expect(res.body).toHaveProperty('message');

    return res;
  }

  /**
   * Start attempt and expect not found error (404)
   */
  async startAttemptExpectNotFound(
    data: StartAttemptRequest,
    expectedError: string,
  ): Promise<Response> {
    const res = await this.startAttempt(data);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', expectedError);

    return res;
  }

  /**
   * Start attempt and expect conflict error (409)
   */
  async startAttemptExpectConflict(
    data: StartAttemptRequest,
  ): Promise<Response> {
    const res = await this.startAttempt(data);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'ATTEMPT_ALREADY_ACTIVE');
    expect(res.body).toHaveProperty(
      'message',
      'User already has an active attempt for this assessment',
    );

    return res;
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
   * Verify error response format
   */
  verifyErrorResponseFormat(
    responseBody: any,
    expectedError: string,
    expectedMessage: string,
  ): void {
    expect(responseBody).toHaveProperty('error', expectedError);
    expect(responseBody).toHaveProperty('message', expectedMessage);
  }

  /**
   * Verify validation error response format
   */
  verifyValidationErrorResponseFormat(responseBody: any): void {
    expect(responseBody).toHaveProperty('error', 'Bad Request');
    expect(responseBody).toHaveProperty('message');
    // NestJS validation pipe format includes statusCode and message array
  }

  /**
   * Test multiple concurrent start attempt requests
   */
  async testConcurrentStartAttempts(
    data: StartAttemptRequest,
    count: number,
  ): Promise<Response[]> {
    const promises = Array.from({ length: count }, () =>
      this.startAttempt(data),
    );
    return await Promise.all(promises);
  }

  /**
   * Measure execution time of start attempt request
   */
  async measureStartAttemptExecutionTime<T>(fn: () => Promise<T>): Promise<{
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
   * Test start attempt performance
   */
  async testStartAttemptPerformance(
    testName: string,
    data: StartAttemptRequest,
    maxExecutionTime: number,
  ): Promise<Response> {
    const { result, executionTime } =
      await this.measureStartAttemptExecutionTime(async () => {
        return await this.startAttemptExpectSuccess(data);
      });

    console.log(`${testName}: ${executionTime}ms (max: ${maxExecutionTime}ms)`);
    expect(executionTime).toBeLessThan(maxExecutionTime);

    return result;
  }

  /**
   * Verify attempt was created in database
   */
  async verifyAttemptCreatedInDatabase(
    attemptId: string,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): Promise<void> {
    const attempt = await this.testSetup.findAttemptById(attemptId);

    expect(attempt).toBeDefined();
    expect(attempt!.id).toBe(attemptId);
    expect(attempt!.userId).toBe(expectedUserId);
    expect(attempt!.assessmentId).toBe(expectedAssessmentId);
    expect(attempt!.status).toBe('IN_PROGRESS');
    expect(attempt!.startedAt).toBeInstanceOf(Date);
  }

  /**
   * Verify attempt data integrity between API response and database
   */
  async verifyAttemptDataIntegrity(
    responseBody: any,
    expectedUserId: string,
    expectedAssessmentId: string,
  ): Promise<void> {
    const attempt = responseBody.attempt;
    const dbAttempt = await this.testSetup.findAttemptById(attempt.id);

    expect(dbAttempt).toBeDefined();
    expect(dbAttempt!.id).toBe(attempt.id);
    expect(dbAttempt!.status).toBe(attempt.status);
    expect(dbAttempt!.userId).toBe(expectedUserId);
    expect(dbAttempt!.assessmentId).toBe(expectedAssessmentId);

    // Compare timestamps (API returns ISO strings, DB returns Date objects)
    expect(new Date(attempt.startedAt)).toEqual(dbAttempt!.startedAt);
    expect(new Date(attempt.createdAt)).toEqual(dbAttempt!.createdAt);
    expect(new Date(attempt.updatedAt)).toEqual(dbAttempt!.updatedAt);

    // Compare time limit if present
    if (attempt.timeLimitExpiresAt) {
      expect(dbAttempt!.timeLimitExpiresAt).toBeDefined();
      expect(new Date(attempt.timeLimitExpiresAt)).toEqual(
        dbAttempt!.timeLimitExpiresAt,
      );
    } else {
      expect(dbAttempt!.timeLimitExpiresAt).toBeNull();
    }
  }

  /**
   * Create test request data
   */
  createValidStartAttemptRequest(
    userId?: string,
    assessmentId?: string,
  ): StartAttemptRequest {
    return {
      userId: userId || this.testSetup.studentUserId,
      assessmentId: assessmentId || this.testSetup.quizAssessmentId,
    };
  }

  /**
   * Create invalid test request data
   */
  createInvalidStartAttemptRequest(overrides: Partial<any> = {}): any {
    return {
      userId: 'invalid-uuid',
      assessmentId: 'invalid-uuid',
      ...overrides,
    };
  }

  /**
   * Verify database state after operations
   */
  async verifyDatabaseState(expectedAttemptCount: number): Promise<void> {
    const actualCount = await this.testSetup.getAttemptsCount();
    expect(actualCount).toBe(expectedAttemptCount);
  }

  /**
   * Wait for database operations to complete
   */
  async waitForDatabase(ms = 100): Promise<void> {
    await this.testSetup.wait(ms);
  }
}
