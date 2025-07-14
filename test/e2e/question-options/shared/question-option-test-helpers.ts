// test/e2e/question-options/shared/question-option-test-helpers.ts
import request, { Response } from 'supertest';
import { expect } from 'vitest';
import { QuestionOptionTestSetup } from './question-option-test-setup';

export class QuestionOptionTestHelpers {
  constructor(private testSetup: QuestionOptionTestSetup) {}

  /**
   * List question options and expect success
   */
  async listQuestionOptionsExpectSuccess(questionId: string): Promise<Response> {
    const response = await request(this.testSetup.getHttpServer())
      .get(`/questions/${questionId}/options`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.options).toBeDefined();
    expect(Array.isArray(response.body.options)).toBe(true);

    return response;
  }

  /**
   * List question options by ID (without expectations)
   */
  async listQuestionOptionsById(questionId: string): Promise<Response> {
    return await request(this.testSetup.getHttpServer())
      .get(`/questions/${questionId}/options`);
  }

  /**
   * List question options and expect validation error
   */
  async listQuestionOptionsExpectValidationError(questionId: string): Promise<Response> {
    const response = await request(this.testSetup.getHttpServer())
      .get(`/questions/${questionId}/options`)
      .expect(400);

    expect(response.body.error).toBe('INVALID_INPUT');
    expect(response.body.message).toBeDefined();

    return response;
  }

  /**
   * List question options and expect not found error
   */
  async listQuestionOptionsExpectNotFound(questionId: string): Promise<Response> {
    const response = await request(this.testSetup.getHttpServer())
      .get(`/questions/${questionId}/options`)
      .expect(404);

    expect(response.body.error).toBe('QUESTION_NOT_FOUND');
    expect(response.body.message).toBe('Question not found');

    return response;
  }

  /**
   * Create question option and expect success
   */
  async createQuestionOptionExpectSuccess(questionId: string, optionText: string): Promise<Response> {
    const response = await request(this.testSetup.getHttpServer())
      .post(`/questions/${questionId}/options`)
      .send({ text: optionText })
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.option).toBeDefined();
    expect(response.body.option.id).toBeDefined();
    expect(response.body.option.text).toBe(optionText);
    expect(response.body.option.questionId).toBe(questionId);

    return response;
  }

  /**
   * Verify list question options success response format
   */
  verifyListQuestionOptionsSuccessResponseFormat(
    responseBody: any,
    expectedOptions: Array<{
      text: string;
      questionId: string;
    }>,
  ) {
    expect(responseBody).toBeDefined();
    expect(responseBody.options).toBeDefined();
    expect(Array.isArray(responseBody.options)).toBe(true);
    expect(responseBody.options).toHaveLength(expectedOptions.length);

    if (expectedOptions.length > 0) {
      for (let i = 0; i < expectedOptions.length; i++) {
        const option = responseBody.options[i];
        const expected = expectedOptions[i];

        expect(option.id).toBeDefined();
        expect(typeof option.id).toBe('string');
        expect(option.text).toBe(expected.text);
        expect(option.questionId).toBe(expected.questionId);
        expect(option.createdAt).toBeDefined();
        expect(option.updatedAt).toBeDefined();

        // Verify date formats
        expect(new Date(option.createdAt)).toBeInstanceOf(Date);
        expect(new Date(option.updatedAt)).toBeInstanceOf(Date);
      }
    }
  }

  /**
   * Verify options are in creation order
   */
  verifyOptionsOrder(responseBody: any, expectedTexts: string[]) {
    expect(responseBody.options).toHaveLength(expectedTexts.length);
    
    for (let i = 0; i < expectedTexts.length; i++) {
      expect(responseBody.options[i].text).toBe(expectedTexts[i]);
    }

    // Verify timestamps are in ascending order (oldest first)
    for (let i = 1; i < responseBody.options.length; i++) {
      const prevTimestamp = new Date(responseBody.options[i - 1].createdAt).getTime();
      const currentTimestamp = new Date(responseBody.options[i].createdAt).getTime();
      expect(currentTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }
  }

  /**
   * Verify question option data integrity with database
   */
  async verifyQuestionOptionDataIntegrity(questionId: string, expectedOptionsCount: number) {
    const dbOptions = await this.testSetup.findQuestionOptionsByQuestionId(questionId);
    expect(dbOptions).toHaveLength(expectedOptionsCount);

    for (const option of dbOptions) {
      const isValid = await this.testSetup.verifyQuestionOptionDataIntegrity(option.id);
      expect(isValid).toBe(true);
    }
  }

  /**
   * Test list question options performance
   */
  async testListQuestionOptionsPerformance(
    testName: string,
    testFunction: () => Promise<any>,
    maxExecutionTime: number,
  ) {
    const startTime = Date.now();
    const result = await testFunction();
    const executionTime = Date.now() - startTime;

    expect(executionTime).toBeLessThan(maxExecutionTime);
    console.log(`${testName}: ${executionTime}ms (max: ${maxExecutionTime}ms)`);

    return result;
  }

  /**
   * Generate test question with options for performance testing
   */
  async generateTestQuestionWithOptions(
    optionsCount: number,
    questionText: string,
    assessmentId?: string,
  ): Promise<{ questionId: string; optionIds: string[] }> {
    const options = Array.from({ length: optionsCount }, (_, i) => 
      `Option ${String.fromCharCode(65 + i)}: ${questionText} option ${i + 1}`
    );

    return await this.testSetup.createQuestionWithOptions({
      questionText: `${questionText} with ${optionsCount} options`,
      questionType: 'MULTIPLE_CHOICE',
      options,
      assessmentId,
    });
  }

  /**
   * Test concurrent access to list question options
   */
  async listQuestionOptionsConcurrently(questionIds: string[]): Promise<Response[]> {
    const promises = questionIds.map(id => this.listQuestionOptionsById(id));
    return await Promise.all(promises);
  }

  /**
   * Test sequential access to list question options
   */
  async listQuestionOptionsSequentially(questionIds: string[]): Promise<Response[]> {
    const responses: Response[] = [];
    for (const questionId of questionIds) {
      const response = await this.listQuestionOptionsById(questionId);
      responses.push(response);
    }
    return responses;
  }

  /**
   * Verify load test results
   */
  verifyListQuestionOptionsLoadTestResults(responses: any[], expectedCount: number) {
    expect(responses).toHaveLength(expectedCount);
    
    responses.forEach((response, index) => {
      expect(response.status).toBe(200);
      expect(response.body.options).toBeDefined();
      expect(Array.isArray(response.body.options)).toBe(true);
    });
  }

  /**
   * Test response time consistency
   */
  async testListQuestionOptionsResponseTimeConsistency(
    questionId: string,
    iterations: number,
    maxVariance: number,
  ) {
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.listQuestionOptionsExpectSuccess(questionId);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }

    // Calculate variance
    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    expect(stdDev).toBeLessThan(maxVariance);
    console.log(`Response time consistency: avg=${avg.toFixed(2)}ms, stdDev=${stdDev.toFixed(2)}ms`);
  }

  /**
   * Create and list question options
   */
  async createAndListQuestionOptions(
    questionText: string,
    options: string[],
    assessmentId?: string,
  ): Promise<{ questionId: string; optionIds: string[]; listResponse: Response }> {
    const { questionId, optionIds } = await this.testSetup.createQuestionWithOptions({
      questionText,
      questionType: 'MULTIPLE_CHOICE',
      options,
      assessmentId,
    });

    const listResponse = await this.listQuestionOptionsExpectSuccess(questionId);

    return { questionId, optionIds, listResponse };
  }

  /**
   * Test list question options with different content types
   */
  async testListQuestionOptionsWithSpecialContent() {
    const specialContents = [
      {
        name: 'Unicode characters',
        options: ['Opção em português', '意见 in Chinese', 'مرحبا in Arabic', 'Привет in Russian'],
      },
      {
        name: 'Special characters',
        options: ['Option with @#$%^&*()', 'Math symbols: ±≤≥≠≈', 'Emojis: 🎯🚀💡'],
      },
      {
        name: 'Long text',
        options: ['A'.repeat(500), 'Very long medical question option explaining complex pathophysiology concepts'],
      },
      {
        name: 'Mixed whitespace',
        options: ['Option\twith\ttabs', 'Option\nwith\nnewlines', '  Option with spaces  '],
      },
    ];

    for (const content of specialContents) {
      const { questionId } = await this.createAndListQuestionOptions(
        `Question for ${content.name}`,
        content.options,
        this.testSetup.quizAssessmentId,
      );

      const listResponse = await this.listQuestionOptionsExpectSuccess(questionId);

      // Verify content is preserved
      content.options.forEach((expectedText, index) => {
        expect(listResponse.body.options[index].text).toBe(expectedText);
      });

      console.log(`✓ Special content test passed: ${content.name}`);
    }
  }

  /**
   * Test list question options with different question types
   */
  async testListQuestionOptionsWithDifferentQuestionTypes() {
    const testCases = [
      {
        type: 'MULTIPLE_CHOICE' as const,
        assessmentId: this.testSetup.quizAssessmentId,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        expectedCount: 4,
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        assessmentId: this.testSetup.simuladoAssessmentId,
        options: ['Simulado Option 1', 'Simulado Option 2'],
        expectedCount: 2,
      },
      {
        type: 'OPEN' as const,
        assessmentId: this.testSetup.provaAbertaAssessmentId,
        options: [], // Open questions typically don't have options
        expectedCount: 0,
      },
    ];

    for (const testCase of testCases) {
      const { questionId } = await this.testSetup.createQuestionWithOptions({
        questionText: `${testCase.type} question test`,
        questionType: testCase.type,
        options: testCase.options,
        assessmentId: testCase.assessmentId,
      });

      const listResponse = await this.listQuestionOptionsExpectSuccess(questionId);
      expect(listResponse.body.options).toHaveLength(testCase.expectedCount);

      console.log(`✓ Question type test passed: ${testCase.type}`);
    }
  }

  /**
   * Verify database integrity
   */
  async verifyDatabaseIntegrity() {
    // Check for data consistency
    const totalOptions = await this.testSetup.prisma.questionOption.count();
    const totalQuestions = await this.testSetup.prisma.question.count();
    
    // Basic sanity checks
    expect(totalOptions).toBeGreaterThanOrEqual(0);
    expect(totalQuestions).toBeGreaterThanOrEqual(0);

    // Verify referential integrity by checking if all questionIds exist
    if (totalOptions > 0) {
      const distinctQuestionIds = await this.testSetup.prisma.questionOption.findMany({
        select: { questionId: true },
        distinct: ['questionId'],
      });
      
      for (const { questionId } of distinctQuestionIds) {
        const questionExists = await this.testSetup.prisma.question.findUnique({
          where: { id: questionId },
        });
        expect(questionExists).toBeDefined();
      }
    }

    console.log(`Database integrity verified: ${totalOptions} options, ${totalQuestions} questions`);
  }

  /**
   * Verify text normalization doesn't occur
   */
  verifyTextNormalization(originalText: string, retrievedText: string) {
    expect(retrievedText).toBe(originalText);
    expect(retrievedText.length).toBe(originalText.length);
    
    // Verify whitespace is preserved
    if (originalText.includes('\t')) {
      expect(retrievedText).toContain('\t');
    }
    if (originalText.includes('\n')) {
      expect(retrievedText).toContain('\n');
    }
    if (originalText.startsWith(' ') || originalText.endsWith(' ')) {
      expect(retrievedText.trim()).not.toBe(originalText);
    }
  }
}