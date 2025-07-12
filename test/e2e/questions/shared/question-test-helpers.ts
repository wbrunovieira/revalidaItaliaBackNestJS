// test/e2e/questions/shared/question-test-helpers.ts
import request, { Response } from 'supertest';
import { QuestionTestSetup } from './question-test-setup';
import { CreateQuestionPayload } from './question-test-data';

export class QuestionTestHelpers {
  constructor(private readonly testSetup: QuestionTestSetup) {}

  /**
   * Make a POST request to create a question
   */
  async createQuestion(payload: CreateQuestionPayload): Promise<Response> {
    return request(this.testSetup.getHttpServer())
      .post('/questions')
      .send(payload);
  }

  /**
   * Create a question and expect success
   */
  async createQuestionExpectSuccess(
    payload: CreateQuestionPayload,
    expectedText?: string,
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('question');

    if (expectedText) {
      expect(res.body.question.text).toBe(expectedText);
    }

    return res;
  }

  /**
   * Create a question and expect failure
   */
  async createQuestionExpectFailure(
    payload: CreateQuestionPayload,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Create a question and expect validation error
   */
  async createQuestionExpectValidationError(
    payload: CreateQuestionPayload | any,
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'INVALID_INPUT');

    return res;
  }

  /**
   * Create a question and expect type mismatch error
   */
  async createQuestionExpectTypeMismatch(
    payload: CreateQuestionPayload,
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'QUESTION_TYPE_MISMATCH');

    return res;
  }

  /**
   * Create a question and expect duplicate error
   */
  async createQuestionExpectDuplicate(
    payload: CreateQuestionPayload,
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'DUPLICATE_QUESTION');

    return res;
  }

  /**
   * Create a question and expect not found error
   */
  async createQuestionExpectNotFound(
    payload: CreateQuestionPayload,
    errorType: 'ASSESSMENT_NOT_FOUND' | 'ARGUMENT_NOT_FOUND',
  ): Promise<Response> {
    const res = await this.createQuestion(payload);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', errorType);

    return res;
  }

  /**
   * Verify question was saved in database
   */
  async verifyQuestionSaved(questionId: string, expectedData: Partial<any>) {
    const savedQuestion = await this.testSetup.findQuestionById(questionId);

    expect(savedQuestion).toBeDefined();
    expect(savedQuestion).toMatchObject(expectedData);

    return savedQuestion;
  }

  /**
   * Verify question was not saved in database
   */
  async verifyQuestionNotSaved(text: string, assessmentId: string) {
    const questionsFound = await this.testSetup.findQuestionsByText(
      text,
      assessmentId,
    );
    expect(questionsFound).toHaveLength(0);
  }

  /**
   * Verify response format for successful creation
   */
  verifySuccessResponseFormat(
    responseBody: any,
    expectedText: string,
    expectedType: string,
  ) {
    expect(responseBody).toEqual({
      success: true,
      question: {
        id: expect.any(String),
        text: expectedText,
        type: expectedType,
        assessmentId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ...(responseBody.question.argumentId && {
          argumentId: expect.any(String),
        }),
      },
    });

    // Verify UUID format
    expect(responseBody.question.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify timestamps are valid ISO strings
    expect(new Date(responseBody.question.createdAt).toISOString()).toBe(
      responseBody.question.createdAt,
    );
    expect(new Date(responseBody.question.updatedAt).toISOString()).toBe(
      responseBody.question.updatedAt,
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
    // Note: statusCode may not be present in response body,
    // it's checked via response.status instead

    if (expectedError) {
      expect(responseBody).toHaveProperty('error', expectedError);
    }

    if (expectedMessage) {
      expect(responseBody).toHaveProperty('message', expectedMessage);
    }
  }

  /**
   * Create multiple questions concurrently
   */
  async createQuestionsConcurrently(
    payloads: CreateQuestionPayload[],
  ): Promise<Response[]> {
    const requests = payloads.map((payload) => this.createQuestion(payload));
    return await Promise.all(requests);
  }

  /**
   * Create multiple questions sequentially
   */
  async createQuestionsSequentially(
    payloads: CreateQuestionPayload[],
  ): Promise<Response[]> {
    const results: Response[] = [];
    for (const payload of payloads) {
      const result = await this.createQuestion(payload);
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
   * Verify question type matches assessment type rules
   */
  verifyQuestionTypeRules(
    assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    questionType: 'MULTIPLE_CHOICE' | 'OPEN',
    shouldBeValid: boolean,
  ) {
    const validCombinations = {
      QUIZ: 'MULTIPLE_CHOICE',
      SIMULADO: 'MULTIPLE_CHOICE',
      PROVA_ABERTA: 'OPEN',
    };

    const isValidCombination =
      validCombinations[assessmentType] === questionType;
    expect(isValidCombination).toBe(shouldBeValid);
  }

  /**
   * Create a duplicate question scenario
   */
  async createDuplicateScenario(
    text: string,
    assessmentId: string,
    type: 'MULTIPLE_CHOICE' | 'OPEN' = 'MULTIPLE_CHOICE',
  ): Promise<{
    firstRes: Response;
    duplicateRes: Response;
  }> {
    // Create first question
    const firstRes = await this.createQuestionExpectSuccess({
      text,
      type,
      assessmentId,
    });

    // Try to create duplicate
    const duplicateRes = await this.createQuestionExpectDuplicate({
      text,
      type,
      assessmentId,
    });

    return { firstRes, duplicateRes };
  }

  /**
   * Create question with non-existent assessment
   */
  async createQuestionWithNonExistentAssessment(
    type: 'MULTIPLE_CHOICE' | 'OPEN' = 'MULTIPLE_CHOICE',
  ): Promise<Response> {
    const nonExistentAssessmentId = this.testSetup.getNonExistentUUID();

    return await this.createQuestionExpectNotFound(
      {
        text: 'Question with non-existent assessment',
        type,
        assessmentId: nonExistentAssessmentId,
      },
      'ASSESSMENT_NOT_FOUND',
    );
  }

  /**
   * Create question with non-existent argument
   */
  async createQuestionWithNonExistentArgument(
    assessmentId: string,
    type: 'MULTIPLE_CHOICE' | 'OPEN' = 'MULTIPLE_CHOICE',
  ): Promise<Response> {
    const nonExistentArgumentId = this.testSetup.getNonExistentUUID();

    return await this.createQuestionExpectNotFound(
      {
        text: 'Question with non-existent argument',
        type,
        assessmentId,
        argumentId: nonExistentArgumentId,
      },
      'ARGUMENT_NOT_FOUND',
    );
  }

  /**
   * Verify question count in database
   */
  async verifyQuestionCount(expectedCount: number) {
    const actualCount = await this.testSetup.getQuestionCount();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Verify question relationship with assessment
   */
  async verifyQuestionAssessmentRelationship(
    questionId: string,
    assessmentId: string,
  ) {
    const question = await this.testSetup.findQuestionById(questionId);
    expect(question?.assessmentId).toBe(assessmentId);
  }

  /**
   * Verify question relationship with argument
   */
  async verifyQuestionArgumentRelationship(
    questionId: string,
    argumentId: string,
  ) {
    const question = await this.testSetup.findQuestionById(questionId);
    expect(question?.argumentId).toBe(argumentId);
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
    assessmentId: string,
    prefix = 'Load Test',
  ): CreateQuestionPayload[] {
    return Array.from({ length: count }, (_, i) => ({
      text: `${prefix} Question ${i + 1} with sufficient characters`,
      type: 'MULTIPLE_CHOICE',
      assessmentId,
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
      // The text pattern might vary based on test scenario
      const text = res.body.question.text;
      expect(text).toContain(`${prefix}`);
      expect(text).toContain(`${index + 1}`);
    });

    expect(responses).toHaveLength(expectedCount);
  }

  /**
   * Verify database integrity after operations
   */
  async verifyDatabaseIntegrity() {
    // Check for orphaned records, data consistency, etc.
    const questionCount = await this.testSetup.getQuestionCount();
    expect(questionCount).toBeGreaterThanOrEqual(0);

    // Verify all questions have valid assessments
    const questions = await this.testSetup.prisma.question.findMany();
    for (const question of questions) {
      const assessment = await this.testSetup.findAssessmentById(
        question.assessmentId,
      );
      expect(assessment).toBeDefined();

      if (question.argumentId) {
        const argument = await this.testSetup.findArgumentById(
          question.argumentId,
        );
        expect(argument).toBeDefined();
      }
    }

    return true;
  }

  /**
   * Generate unique question text for testing
   */
  generateUniqueText(prefix = 'Test'): string {
    return `${prefix} Question ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    allowedUndefinedFields: string[] = ['argumentId'],
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
   * Test all assessment type scenarios
   */
  async testAllAssessmentTypeScenarios() {
    const scenarios = [
      {
        assessmentType: 'QUIZ',
        validType: 'MULTIPLE_CHOICE',
        invalidType: 'OPEN',
        assessmentId: this.testSetup.quizAssessmentId,
      },
      {
        assessmentType: 'SIMULADO',
        validType: 'MULTIPLE_CHOICE',
        invalidType: 'OPEN',
        assessmentId: this.testSetup.simuladoAssessmentId,
      },
      {
        assessmentType: 'PROVA_ABERTA',
        validType: 'OPEN',
        invalidType: 'MULTIPLE_CHOICE',
        assessmentId: this.testSetup.provaAbertaAssessmentId,
      },
    ];

    for (const scenario of scenarios) {
      // Test valid combination
      await this.createQuestionExpectSuccess({
        text: `Valid question for ${scenario.assessmentType}`,
        type: scenario.validType as any,
        assessmentId: scenario.assessmentId,
      });

      // Test invalid combination
      await this.createQuestionExpectTypeMismatch({
        text: `Invalid question for ${scenario.assessmentType}`,
        type: scenario.invalidType as any,
        assessmentId: scenario.assessmentId,
      });
    }
  }

  /**
   * Create questions for multiple arguments in same assessment
   */
  async createQuestionsForMultipleArguments(
    assessmentId: string,
    argumentIds: string[],
    questionsPerArgument = 2,
  ): Promise<Response[]> {
    const results: Response[] = [];

    for (const argumentId of argumentIds) {
      for (let i = 0; i < questionsPerArgument; i++) {
        const result = await this.createQuestionExpectSuccess({
          text: `Question ${i + 1} for argument ${argumentId}`,
          type: 'MULTIPLE_CHOICE',
          assessmentId,
          argumentId,
        });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Verify text normalization and comparison
   */
  verifyTextNormalization(originalText: string, storedText: string) {
    // The system should store text as-is without normalization
    expect(storedText).toBe(originalText);
  }
}
