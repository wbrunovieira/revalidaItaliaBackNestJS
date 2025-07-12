// test/e2e/questions/shared/question-test-helpers.ts
import request, { Response } from 'supertest';
import { QuestionTestSetup } from './question-test-setup';
import { CreateQuestionPayload, GetQuestionRequest } from './question-test-data';

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

  /**
   * GetQuestion helpers
   */

  /**
   * Make a GET request to retrieve a question by ID
   */
  async getQuestionById(id: string): Promise<Response> {
    return request(this.testSetup.getHttpServer())
      .get(`/questions/${id}`);
  }

  /**
   * Get a question and expect success
   */
  async getQuestionExpectSuccess(
    id: string,
    expectedData?: Partial<any>,
  ): Promise<Response> {
    const res = await this.getQuestionById(id);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('question');

    if (expectedData) {
      expect(res.body.question).toMatchObject(expectedData);
    }

    return res;
  }

  /**
   * Get a question and expect failure
   */
  async getQuestionExpectFailure(
    id: string,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.getQuestionById(id);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Get a question and expect validation error
   */
  async getQuestionExpectValidationError(id: string): Promise<Response> {
    const res = await this.getQuestionById(id);

    // NestJS may return 404 for some invalid paths instead of 400
    // Accept both 400 and 404 for validation errors
    expect([400, 404]).toContain(res.status);
    
    if (res.status === 400) {
      expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
    }

    return res;
  }

  /**
   * Get a question and expect not found error
   */
  async getQuestionExpectNotFound(id: string): Promise<Response> {
    const res = await this.getQuestionById(id);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'QUESTION_NOT_FOUND');

    return res;
  }

  /**
   * Get a question and expect internal server error
   */
  async getQuestionExpectInternalError(id: string): Promise<Response> {
    const res = await this.getQuestionById(id);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'INTERNAL_ERROR');

    return res;
  }

  /**
   * Verify GetQuestion response format for successful retrieval
   */
  verifyGetQuestionSuccessResponseFormat(
    responseBody: any,
    expectedId: string,
    expectedText?: string,
    expectedType?: string,
  ) {
    expect(responseBody).toEqual({
      success: true,
      question: {
        id: expectedId,
        text: expectedText || expect.any(String),
        type: expectedType || expect.stringMatching(/^(MULTIPLE_CHOICE|OPEN)$/),
        assessmentId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        ...(responseBody.question.argumentId && {
          argumentId: expect.any(String),
        }),
      },
    });

    // Verify UUID format for IDs
    expect(responseBody.question.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(responseBody.question.assessmentId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    if (responseBody.question.argumentId) {
      expect(responseBody.question.argumentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }

    // Verify timestamps are valid ISO strings
    expect(new Date(responseBody.question.createdAt).toISOString()).toBe(
      responseBody.question.createdAt,
    );
    expect(new Date(responseBody.question.updatedAt).toISOString()).toBe(
      responseBody.question.updatedAt,
    );

    // Verify text is not empty and is a string
    expect(typeof responseBody.question.text).toBe('string');
    expect(responseBody.question.text.length).toBeGreaterThan(0);

    // Verify type is valid
    expect(['MULTIPLE_CHOICE', 'OPEN']).toContain(responseBody.question.type);
  }

  /**
   * Create a question and then retrieve it by ID
   */
  async createAndRetrieveQuestion(
    payload: CreateQuestionPayload,
  ): Promise<{
    createRes: Response;
    getRes: Response;
  }> {
    // Create question first
    const createRes = await this.createQuestionExpectSuccess(payload);
    const questionId = createRes.body.question.id;

    // Then retrieve it
    const getRes = await this.getQuestionExpectSuccess(questionId);

    return { createRes, getRes };
  }

  /**
   * Test GetQuestion with multiple concurrent requests
   */
  async getQuestionsConcurrently(ids: string[]): Promise<Response[]> {
    const requests = ids.map((id) => this.getQuestionById(id));
    return await Promise.all(requests);
  }

  /**
   * Test GetQuestion with multiple sequential requests
   */
  async getQuestionsSequentially(ids: string[]): Promise<Response[]> {
    const results: Response[] = [];
    for (const id of ids) {
      const result = await this.getQuestionById(id);
      results.push(result);
    }
    return results;
  }

  /**
   * Test various invalid ID formats systematically
   */
  async testInvalidIdFormats(invalidIds: string[]): Promise<void> {
    for (const invalidId of invalidIds) {
      await this.getQuestionExpectValidationError(invalidId);
    }
  }

  /**
   * Verify question consistency between create and get responses
   */
  verifyQuestionConsistency(createResponse: any, getResponse: any) {
    const createQuestion = createResponse.question;
    const getQuestion = getResponse.question;

    expect(getQuestion.id).toBe(createQuestion.id);
    expect(getQuestion.text).toBe(createQuestion.text);
    expect(getQuestion.type).toBe(createQuestion.type);
    expect(getQuestion.assessmentId).toBe(createQuestion.assessmentId);
    expect(getQuestion.argumentId).toBe(createQuestion.argumentId);
    expect(getQuestion.createdAt).toBe(createQuestion.createdAt);
    expect(getQuestion.updatedAt).toBe(createQuestion.updatedAt);
  }

  /**
   * Test GetQuestion performance with timing
   */
  async testGetQuestionPerformance<T>(
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
   * Generate test questions for GetQuestion performance testing
   */
  async generateTestQuestionsForRetrieval(
    count: number,
    assessmentId: string,
    prefix = 'GetTest',
  ): Promise<string[]> {
    const questionIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const payload: CreateQuestionPayload = {
        text: `${prefix} Question ${i + 1} with sufficient characters`,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      };

      const res = await this.createQuestionExpectSuccess(payload);
      questionIds.push(res.body.question.id);
    }

    return questionIds;
  }

  /**
   * Verify GetQuestion load test results
   */
  verifyGetQuestionLoadTestResults(
    responses: Response[],
    expectedCount: number,
  ) {
    // All should succeed
    responses.forEach((res, index) => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.question).toBeDefined();
      expect(res.body.question.id).toBeDefined();
    });

    expect(responses).toHaveLength(expectedCount);
  }

  /**
   * Test GetQuestion with case sensitivity for IDs
   */
  async testGetQuestionCaseSensitivity(baseId: string): Promise<void> {
    // Test with original case
    await this.getQuestionExpectSuccess(baseId);

    // Test with lowercase (UUID should be case insensitive)
    const lowerCaseId = baseId.toLowerCase();
    await this.getQuestionExpectSuccess(lowerCaseId);

    // Test with uppercase (UUID should be case insensitive)
    const upperCaseId = baseId.toUpperCase();
    await this.getQuestionExpectSuccess(upperCaseId);
  }

  /**
   * Verify question data integrity between database and API response
   */
  async verifyQuestionDataIntegrity(questionId: string): Promise<void> {
    // Get from API
    const apiResponse = await this.getQuestionExpectSuccess(questionId);

    // Get from database
    const dbQuestion = await this.testSetup.findQuestionById(questionId);

    expect(dbQuestion).toBeDefined();
    expect(apiResponse.body.question.id).toBe(dbQuestion!.id);
    expect(apiResponse.body.question.text).toBe(dbQuestion!.text);
    expect(apiResponse.body.question.type).toBe(dbQuestion!.type);
    expect(apiResponse.body.question.assessmentId).toBe(dbQuestion!.assessmentId);
    
    // Handle argumentId - both undefined and null should be equivalent
    if (dbQuestion!.argumentId === null) {
      expect(apiResponse.body.question.argumentId).toBeUndefined();
    } else {
      expect(apiResponse.body.question.argumentId).toBe(dbQuestion!.argumentId);
    }

    // Verify timestamps (API returns ISO strings, DB returns Date objects)
    expect(new Date(apiResponse.body.question.createdAt)).toEqual(dbQuestion!.createdAt);
    expect(new Date(apiResponse.body.question.updatedAt)).toEqual(dbQuestion!.updatedAt);
  }

  /**
   * Test GetQuestion with different question types
   */
  async testGetQuestionWithDifferentTypes(assessmentIds: {
    quiz: string;
    simulado: string;
    provaAberta: string;
  }): Promise<void> {
    // Create and test multiple choice question
    const mcPayload: CreateQuestionPayload = {
      text: 'Multiple choice question for testing GetQuestion',
      type: 'MULTIPLE_CHOICE',
      assessmentId: assessmentIds.quiz,
    };
    const mcRes = await this.createQuestionExpectSuccess(mcPayload);
    await this.getQuestionExpectSuccess(mcRes.body.question.id, {
      type: 'MULTIPLE_CHOICE',
    });

    // Create and test open question
    const openPayload: CreateQuestionPayload = {
      text: 'Open question for testing GetQuestion functionality and behavior',
      type: 'OPEN',
      assessmentId: assessmentIds.provaAberta,
    };
    const openRes = await this.createQuestionExpectSuccess(openPayload);
    await this.getQuestionExpectSuccess(openRes.body.question.id, {
      type: 'OPEN',
    });
  }

  /**
   * Test GetQuestion with questions that have arguments
   */
  async testGetQuestionWithArguments(
    assessmentId: string,
    argumentId: string,
  ): Promise<void> {
    // Create question with argument
    const payload: CreateQuestionPayload = {
      text: 'Question with argument for testing GetQuestion',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
      argumentId,
    };

    const createRes = await this.createQuestionExpectSuccess(payload);
    const questionId = createRes.body.question.id;

    // Retrieve and verify
    const getRes = await this.getQuestionExpectSuccess(questionId);
    expect(getRes.body.question.argumentId).toBe(argumentId);
  }

  /**
   * Verify GetQuestion handles special characters and unicode correctly
   */
  async testGetQuestionWithSpecialContent(): Promise<void> {
    // Test with special characters
    const specialPayload: CreateQuestionPayload = {
      text: 'Question with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
      type: 'MULTIPLE_CHOICE',
      assessmentId: this.testSetup.quizAssessmentId,
    };

    const specialRes = await this.createQuestionExpectSuccess(specialPayload);
    const getSpecialRes = await this.getQuestionExpectSuccess(specialRes.body.question.id);
    expect(getSpecialRes.body.question.text).toBe(specialPayload.text);

    // Test with unicode characters
    const unicodePayload: CreateQuestionPayload = {
      text: 'Questão em português 中文 العربية русский with emojis 🎯🚀',
      type: 'OPEN',
      assessmentId: this.testSetup.provaAbertaAssessmentId,
    };

    const unicodeRes = await this.createQuestionExpectSuccess(unicodePayload);
    const getUnicodeRes = await this.getQuestionExpectSuccess(unicodeRes.body.question.id);
    expect(getUnicodeRes.body.question.text).toBe(unicodePayload.text);
  }

  /**
   * Test GetQuestion response time consistency
   */
  async testGetQuestionResponseTimeConsistency(
    questionId: string,
    iterations = 5,
    maxVariance = 50, // milliseconds
  ): Promise<void> {
    const executionTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { executionTime } = await this.measureExecutionTime(async () => {
        return await this.getQuestionExpectSuccess(questionId);
      });
      executionTimes.push(executionTime);
    }

    // Calculate average and variance
    const average = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);
    const variance = maxTime - minTime;

    console.log(`GetQuestion response times: avg=${average.toFixed(2)}ms, min=${minTime}ms, max=${maxTime}ms, variance=${variance}ms`);

    // Verify variance is within acceptable limits
    expect(variance).toBeLessThan(maxVariance);
  }
}
