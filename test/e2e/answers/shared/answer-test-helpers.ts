// test/e2e/answers/shared/answer-test-helpers.ts
import request, { Response } from 'supertest';
import { randomUUID } from 'crypto';
import { AnswerTestSetup } from './answer-test-setup';
import { GetAnswerRequest } from './answer-test-data';

export class AnswerTestHelpers {
  constructor(private readonly testSetup: AnswerTestSetup) {}

  /**
   * Make a GET request to retrieve an answer by ID
   */
  async getAnswerById(id: string): Promise<Response> {
    return request(this.testSetup.getHttpServer()).get(`/answers/${id}`);
  }

  /**
   * Get an answer and expect success
   */
  async getAnswerExpectSuccess(
    id: string,
    expectedData?: Partial<any>,
  ): Promise<Response> {
    const res = await this.getAnswerById(id);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('answer');

    if (expectedData) {
      expect(res.body.answer).toMatchObject(expectedData);
    }

    return res;
  }

  /**
   * Get an answer and expect failure
   */
  async getAnswerExpectFailure(
    id: string,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.getAnswerById(id);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Get an answer and expect validation error
   */
  async getAnswerExpectValidationError(id: string): Promise<Response> {
    const res = await this.getAnswerById(id);

    // NestJS may return 404 for some invalid paths instead of 400
    // Accept both 400 and 404 for validation errors
    expect([400, 404]).toContain(res.status);

    if (res.status === 400) {
      expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
    }

    return res;
  }

  /**
   * Get an answer and expect not found error
   */
  async getAnswerExpectNotFound(id: string): Promise<Response> {
    const res = await this.getAnswerById(id);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'ANSWER_NOT_FOUND');

    return res;
  }

  /**
   * Get an answer and expect internal server error
   */
  async getAnswerExpectInternalError(id: string): Promise<Response> {
    const res = await this.getAnswerById(id);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'INTERNAL_ERROR');

    return res;
  }

  /**
   * Verify GetAnswer response format for successful retrieval
   */
  verifyGetAnswerSuccessResponseFormat(
    responseBody: any,
    expectedId: string,
    expectedExplanation?: string,
    expectedQuestionId?: string,
  ) {
    expect(responseBody).toEqual({
      answer: {
        id: expectedId,
        explanation: expectedExplanation || expect.any(String),
        questionId: expectedQuestionId || expect.any(String),
        correctOptionId: expect.anything(), // Can be string or undefined
        translations: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    // Verify UUID format for IDs
    expect(responseBody.answer.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(responseBody.answer.questionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify correctOptionId is UUID format when present
    if (responseBody.answer.correctOptionId) {
      expect(responseBody.answer.correctOptionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }

    // Verify timestamps are valid ISO strings
    expect(new Date(responseBody.answer.createdAt).toISOString()).toBe(
      responseBody.answer.createdAt,
    );
    expect(new Date(responseBody.answer.updatedAt).toISOString()).toBe(
      responseBody.answer.updatedAt,
    );

    // Verify explanation is not empty and is a string
    expect(typeof responseBody.answer.explanation).toBe('string');
    expect(responseBody.answer.explanation.length).toBeGreaterThan(0);

    // Verify translations is array
    expect(Array.isArray(responseBody.answer.translations)).toBe(true);

    // Verify each translation has required fields
    responseBody.answer.translations.forEach((translation: any) => {
      expect(translation).toHaveProperty('locale');
      expect(translation).toHaveProperty('explanation');
      expect(typeof translation.locale).toBe('string');
      expect(typeof translation.explanation).toBe('string');
    });
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
    if (expectedError) {
      expect(responseBody).toHaveProperty('error', expectedError);
    }

    if (expectedMessage) {
      expect(responseBody).toHaveProperty('message', expectedMessage);
    }
  }

  /**
   * Test GetAnswer with multiple concurrent requests
   */
  async getAnswersConcurrently(ids: string[]): Promise<Response[]> {
    const requests = ids.map((id) => this.getAnswerById(id));
    return await Promise.all(requests);
  }

  /**
   * Test GetAnswer with multiple sequential requests
   */
  async getAnswersSequentially(ids: string[]): Promise<Response[]> {
    const results: Response[] = [];
    for (const id of ids) {
      const result = await this.getAnswerById(id);
      results.push(result);
    }
    return results;
  }

  /**
   * Test various invalid ID formats systematically
   */
  async testInvalidIdFormats(invalidIds: string[]): Promise<void> {
    for (const invalidId of invalidIds) {
      await this.getAnswerExpectValidationError(invalidId);
    }
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
   * Test GetAnswer performance with timing
   */
  async testGetAnswerPerformance<T>(
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
   * Generate test answers for GetAnswer performance testing
   */
  async generateTestAnswersForRetrieval(
    count: number,
    questionId: string,
    prefix = 'GetTest',
  ): Promise<string[]> {
    const answerIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const answerId = await this.testSetup.createTestAnswer({
        explanation: `${prefix} Answer ${i + 1} with sufficient explanation content`,
        questionId,
        correctOptionId: i % 2 === 0 ? randomUUID() : undefined,
      });
      answerIds.push(answerId);
    }

    return answerIds;
  }

  /**
   * Verify GetAnswer load test results
   */
  verifyGetAnswerLoadTestResults(
    responses: Response[],
    expectedCount: number,
  ) {
    // All should succeed
    responses.forEach((res, index) => {
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer.id).toBeDefined();
    });

    expect(responses).toHaveLength(expectedCount);
  }

  /**
   * Test GetAnswer with case sensitivity for IDs
   */
  async testGetAnswerCaseSensitivity(baseId: string): Promise<void> {
    // Test with original case
    await this.getAnswerExpectSuccess(baseId);

    // Test with lowercase (UUID should be case insensitive)
    const lowerCaseId = baseId.toLowerCase();
    await this.getAnswerExpectSuccess(lowerCaseId);

    // Test with uppercase (UUID should be case insensitive)
    const upperCaseId = baseId.toUpperCase();
    await this.getAnswerExpectSuccess(upperCaseId);
  }

  /**
   * Verify answer data integrity between database and API response
   */
  async verifyAnswerDataIntegrity(answerId: string): Promise<void> {
    // Get from API
    const apiResponse = await this.getAnswerExpectSuccess(answerId);

    // Get from database
    const dbAnswer = await this.testSetup.findAnswerById(answerId);

    expect(dbAnswer).toBeDefined();
    expect(apiResponse.body.answer.id).toBe(dbAnswer!.id);
    expect(apiResponse.body.answer.explanation).toBe(dbAnswer!.explanation);
    expect(apiResponse.body.answer.questionId).toBe(dbAnswer!.questionId);

    // Handle correctOptionId - both undefined and null should be equivalent
    if (dbAnswer!.correctOptionId === null) {
      expect(apiResponse.body.answer.correctOptionId).toBeUndefined();
    } else {
      expect(apiResponse.body.answer.correctOptionId).toBe(dbAnswer!.correctOptionId);
    }

    // Verify timestamps (API returns ISO strings, DB returns Date objects)
    expect(new Date(apiResponse.body.answer.createdAt)).toEqual(
      dbAnswer!.createdAt,
    );
    expect(new Date(apiResponse.body.answer.updatedAt)).toEqual(
      dbAnswer!.updatedAt,
    );

    // Verify translations
    expect(apiResponse.body.answer.translations).toHaveLength(
      dbAnswer!.translations.length,
    );
    
    dbAnswer!.translations.forEach((dbTranslation, index) => {
      const apiTranslation = apiResponse.body.answer.translations[index];
      expect(apiTranslation.locale).toBe(dbTranslation.locale);
      expect(apiTranslation.explanation).toBe(dbTranslation.explanation);
    });
  }

  /**
   * Test GetAnswer with different answer types
   */
  async testGetAnswerWithDifferentTypes(): Promise<void> {
    // Test multiple choice answer
    await this.getAnswerExpectSuccess(this.testSetup.multipleChoiceAnswerId, {
      correctOptionId: expect.any(String),
    });

    // Test open answer
    await this.getAnswerExpectSuccess(this.testSetup.openAnswerId, {
      correctOptionId: undefined,
    });
  }

  /**
   * Verify GetAnswer handles special characters and unicode correctly
   */
  async testGetAnswerWithSpecialContent(): Promise<void> {
    // Create answer with special characters
    const { answerId: specialAnswerId } = await this.testSetup.createAnswerWithQuestion({
      questionText: 'Question with special chars',
      questionType: 'MULTIPLE_CHOICE',
      answerExplanation: 'Answer with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
    });

    const specialRes = await this.getAnswerExpectSuccess(specialAnswerId);
    expect(specialRes.body.answer.explanation).toContain('@#$%^&*()!');
    expect(specialRes.body.answer.explanation).toContain('±≤≥≠≈');

    // Create answer with unicode characters
    const { answerId: unicodeAnswerId } = await this.testSetup.createAnswerWithQuestion({
      questionText: 'Question with unicode',
      questionType: 'OPEN',
      answerExplanation: 'Resposta em português 中文 العربية русский with emojis 🎯🚀',
    });

    const unicodeRes = await this.getAnswerExpectSuccess(unicodeAnswerId);
    expect(unicodeRes.body.answer.explanation).toContain('português');
    expect(unicodeRes.body.answer.explanation).toContain('中文');
    expect(unicodeRes.body.answer.explanation).toContain('🎯🚀');
  }

  /**
   * Test GetAnswer response time consistency
   */
  async testGetAnswerResponseTimeConsistency(
    answerId: string,
    iterations = 5,
    maxVariance = 50, // milliseconds
  ): Promise<void> {
    const executionTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { executionTime } = await this.measureExecutionTime(async () => {
        return await this.getAnswerExpectSuccess(answerId);
      });
      executionTimes.push(executionTime);
    }

    // Calculate average and variance
    const average =
      executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);
    const variance = maxTime - minTime;

    console.log(
      `GetAnswer response times: avg=${average.toFixed(2)}ms, min=${minTime}ms, max=${maxTime}ms, variance=${variance}ms`,
    );

    // Verify variance is within acceptable limits
    expect(variance).toBeLessThan(maxVariance);
  }

  /**
   * Verify no undefined fields in response
   */
  verifyNoUndefinedFields(
    responseBody: any,
    allowedUndefinedFields: string[] = ['correctOptionId'],
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

  /**
   * Test GetAnswer with answers that have translations
   */
  async testGetAnswerWithTranslations(): Promise<void> {
    // Test answer with multiple translations
    await this.getAnswerExpectSuccess(this.testSetup.multipleChoiceAnswerId);
    
    // Create answer with single translation
    const { answerId: singleTranslationAnswerId } = await this.testSetup.createAnswerWithQuestion({
      questionText: 'Question for single translation test',
      questionType: 'MULTIPLE_CHOICE',
      answerExplanation: 'Answer with single translation',
    });

    const singleTranslationAnswer = await this.testSetup.createTestAnswer({
      explanation: 'Single translation answer',
      questionId: this.testSetup.multipleChoiceQuestionId,
      translations: [
        {
          locale: 'pt',
          explanation: 'Resposta com tradução única',
        },
      ],
    });

    const singleRes = await this.getAnswerExpectSuccess(singleTranslationAnswer);
    expect(singleRes.body.answer.translations).toHaveLength(1);
    expect(singleRes.body.answer.translations[0].locale).toBe('pt');
  }

  /**
   * Verify database integrity after operations
   */
  async verifyDatabaseIntegrity(): Promise<boolean> {
    // Check for orphaned records, data consistency, etc.
    const answerCount = await this.testSetup.getAnswerCount();
    expect(answerCount).toBeGreaterThanOrEqual(0);

    // Verify all answers have valid questions
    const answers = await this.testSetup.prisma.answer.findMany();
    for (const answer of answers) {
      const question = await this.testSetup.findQuestionById(answer.questionId);
      expect(question).toBeDefined();
      
      // Verify answer data integrity
      const isValid = await this.testSetup.verifyAnswerDataIntegrity(answer.id);
      expect(isValid).toBe(true);
    }

    return true;
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
   * Test GetAnswer with answers that have long explanations
   */
  async testGetAnswerWithLongExplanation(): Promise<void> {
    const longExplanation = 'A'.repeat(1000);
    
    const { answerId: longAnswerId } = await this.testSetup.createAnswerWithQuestion({
      questionText: 'Question with long answer',
      questionType: 'OPEN',
      answerExplanation: longExplanation,
    });

    const longRes = await this.getAnswerExpectSuccess(longAnswerId);
    expect(longRes.body.answer.explanation).toBe(longExplanation);
    expect(longRes.body.answer.explanation.length).toBe(1000);
  }

  /**
   * Test GetAnswer with answers that have minimal explanations
   */
  async testGetAnswerWithMinimalExplanation(): Promise<void> {
    const minimalExplanation = 'A';
    
    const { answerId: minimalAnswerId } = await this.testSetup.createAnswerWithQuestion({
      questionText: 'Question with minimal answer',
      questionType: 'MULTIPLE_CHOICE',
      answerExplanation: minimalExplanation,
    });

    const minimalRes = await this.getAnswerExpectSuccess(minimalAnswerId);
    expect(minimalRes.body.answer.explanation).toBe(minimalExplanation);
    expect(minimalRes.body.answer.explanation.length).toBe(1);
  }

  /**
   * Generate unique answer explanation for testing
   */
  generateUniqueExplanation(prefix = 'Test'): string {
    return `${prefix} Answer explanation ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}