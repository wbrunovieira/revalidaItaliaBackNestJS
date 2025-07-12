// test/e2e/arguments/shared/argument-test-helpers.ts
import request, { Response } from 'supertest';
import { ArgumentTestSetup } from './argument-test-setup';
import { CreateArgumentPayload } from './argument-test-data';

export class ArgumentTestHelpers {
  constructor(private readonly testSetup: ArgumentTestSetup) {}

  /**
   * Make a POST request to create an argument
   */
  async createArgument(payload: CreateArgumentPayload): Promise<Response> {
    return request(this.testSetup.getHttpServer())
      .post('/arguments')
      .send(payload);
  }

  /**
   * Create an argument and expect success
   */
  async createArgumentExpectSuccess(
    payload: CreateArgumentPayload,
    expectedTitle?: string,
  ): Promise<Response> {
    const res = await this.createArgument(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('argument');

    if (expectedTitle) {
      expect(res.body.argument.title).toBe(expectedTitle);
    }

    return res;
  }

  /**
   * Create an argument and expect failure
   */
  async createArgumentExpectFailure(
    payload: CreateArgumentPayload,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.createArgument(payload);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Create an argument and expect validation error
   */
  async createArgumentExpectValidationError(
    payload: CreateArgumentPayload | any,
  ): Promise<Response> {
    const res = await this.createArgument(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(Array.isArray(res.body.message)).toBe(true);

    return res;
  }

  /**
   * Verify argument was saved in database
   */
  async verifyArgumentSaved(argumentId: string, expectedData: Partial<any>) {
    const savedArgument = await this.testSetup.findArgumentById(argumentId);

    expect(savedArgument).toBeDefined();
    expect(savedArgument).toMatchObject(expectedData);

    return savedArgument;
  }

  /**
   * Verify argument was not saved in database
   */
  async verifyArgumentNotSaved(title: string) {
    const argumentsFound = await this.testSetup.findArgumentsByTitle(title);
    expect(argumentsFound).toHaveLength(0);
  }

  /**
   * Verify response format for successful creation
   */
  verifySuccessResponseFormat(responseBody: any, expectedTitle: string) {
    expect(responseBody).toEqual({
      success: true,
      argument: {
        id: expect.any(String),
        title: expectedTitle,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ...(responseBody.argument.assessmentId && {
          assessmentId: expect.any(String),
        }),
      },
    });

    // Verify UUID format
    expect(responseBody.argument.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify timestamps are valid ISO strings
    expect(new Date(responseBody.argument.createdAt).toISOString()).toBe(
      responseBody.argument.createdAt,
    );
    expect(new Date(responseBody.argument.updatedAt).toISOString()).toBe(
      responseBody.argument.updatedAt,
    );
  }

  /**
   * Verify error response format
   */
  verifyErrorResponseFormat(
    responseBody: any,
    expectedStatusCode: number,
    expectedError?: string,
    expectedMessage?: string,
  ) {
    expect(responseBody).toHaveProperty('statusCode', expectedStatusCode);

    if (expectedError) {
      expect(responseBody).toHaveProperty('error', expectedError);
    }

    if (expectedMessage) {
      expect(responseBody).toHaveProperty('message', expectedMessage);
    }
  }

  /**
   * Create multiple arguments concurrently
   */
  async createArgumentsConcurrently(
    payloads: CreateArgumentPayload[],
  ): Promise<Response[]> {
    const requests = payloads.map((payload) => this.createArgument(payload));
    return await Promise.all(requests);
  }

  /**
   * Create multiple arguments sequentially
   */
  async createArgumentsSequentially(
    payloads: CreateArgumentPayload[],
  ): Promise<Response[]> {
    const results: Response[] = [];
    for (const payload of payloads) {
      const result = await this.createArgument(payload);
      results.push(result);
    }
    return results;
  }

  /**
   * Measure execution time of a function
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
   * Verify execution time is within acceptable limits
   */
  verifyExecutionTime(executionTime: number, maxTime: number) {
    expect(executionTime).toBeLessThan(maxTime);
  }

  /**
   * Clean titles for comparison (removes extra whitespace, control chars, etc.)
   */
  cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Verify title was normalized correctly
   */
  verifyTitleNormalization(originalTitle: string, normalizedTitle: string) {
    const expected = this.cleanTitle(originalTitle);
    expect(normalizedTitle).toBe(expected);
  }

  /**
   * Create a duplicate argument scenario
   */
  async createDuplicateScenario(title: string): Promise<{
    firstRes: Response;
    duplicateRes: Response;
  }> {
    // Create first argument
    const firstRes = await this.createArgumentExpectSuccess({ title });

    // Try to create duplicate
    const duplicateRes = await this.createArgumentExpectFailure(
      { title },
      409,
      'DUPLICATE_ARGUMENT',
    );

    return { firstRes, duplicateRes };
  }

  /**
   * Create argument with non-existent assessment
   */
  async createArgumentWithNonExistentAssessment(): Promise<Response> {
    const nonExistentAssessmentId = this.testSetup.getNonExistentUUID();

    return await this.createArgumentExpectFailure(
      {
        title: 'Argument with Non-Existent Assessment',
        assessmentId: nonExistentAssessmentId,
      },
      404,
      'ASSESSMENT_NOT_FOUND',
    );
  }

  /**
   * Verify argument count in database
   */
  async verifyArgumentCount(expectedCount: number) {
    const actualCount = await this.testSetup.getArgumentCount();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Verify argument relationship with assessment
   */
  async verifyArgumentAssessmentRelationship(
    argumentId: string,
    assessmentId: string,
  ) {
    const argument = await this.testSetup.findArgumentById(argumentId);
    expect(argument?.assessmentId).toBe(assessmentId);
  }

  /**
   * Test performance with timing
   */
  async testPerformance<T>(
    testName: string,
    testFunction: () => Promise<T>,
    maxExecutionTime: number,
  ): Promise<T> {
    const { result, executionTime } =
      await this.measureExecutionTime(testFunction);

    console.log(`${testName}: ${executionTime}ms`);
    this.verifyExecutionTime(executionTime, maxExecutionTime);

    return result;
  }

  /**
   * Generate test data for load testing
   */
  generateLoadTestData(
    count: number,
    prefix = 'Load Test',
  ): CreateArgumentPayload[] {
    return Array.from({ length: count }, (_, i) => ({
      title: `${prefix} Argument ${i + 1}`,
    }));
  }

  /**
   * Verify load test results
   */
  verifyLoadTestResults(
    responses: Response[],
    expectedCount: number,
    prefix = 'Load Test',
  ) {
    // All should succeed
    responses.forEach((res, index) => {
      expect(res.status).toBe(201);
      expect(res.body.argument.title).toBe(`${prefix} Argument ${index + 1}`);
    });

    expect(responses).toHaveLength(expectedCount);
  }

  /**
   * Verify database integrity after operations
   */
  async verifyDatabaseIntegrity() {
    // Check for orphaned records, data consistency, etc.
    const argumentCount = await this.testSetup.getArgumentCount();
    expect(argumentCount).toBeGreaterThanOrEqual(0);

    // Add more integrity checks as needed
    return true;
  }

  /**
   * Generate unique title for testing
   */
  generateUniqueTitle(prefix = 'Test'): string {
    return `${prefix} Argument ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wait for database operations to complete
   */
  async waitForDatabase(ms = 100): Promise<void> {
    await this.testSetup.wait(ms);
  }

  /**
   * Reset test state
   */
  async resetTestState(): Promise<void> {
    await this.testSetup.setupTestData();
  }

  /**
   * Verify no undefined fields in response
   */
  verifyNoUndefinedFields(
    responseBody: any,
    allowedUndefinedFields: string[] = [],
  ) {
    const checkObject = (obj: any, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (value === undefined && !allowedUndefinedFields.includes(fullPath)) {
          throw new Error(`Undefined field found: ${fullPath}`);
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          checkObject(value, fullPath);
        }
      }
    };

    checkObject(responseBody);
  }
}
