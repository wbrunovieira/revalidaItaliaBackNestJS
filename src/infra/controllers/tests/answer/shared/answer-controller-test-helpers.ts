// src/infra/controllers/tests/answer/shared/answer-controller-test-helpers.ts
import { left, right } from '@/core/either';
import { AnswerControllerTestSetup } from './answer-controller-test-setup';
import { GetAnswerRequest } from '@/domain/assessment/application/dtos/get-answer-request.dto';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AnswerNotFoundError } from '@/domain/assessment/application/use-cases/errors/answer-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class AnswerControllerTestHelpers {
  constructor(private readonly testSetup: AnswerControllerTestSetup) {}

  /**
   * Mock successful answer retrieval
   */
  mockGetAnswerSuccess(answerData: any) {
    const result = {
      answer: {
        id: answerData.id,
        correctOptionId: answerData.correctOptionId || undefined,
        explanation: answerData.explanation || 'This is the correct answer because...',
        questionId: answerData.questionId || this.generateUniqueId(),
        translations: answerData.translations || [
          {
            locale: 'pt',
            explanation: answerData.explanation || 'Esta é a resposta correta porque...',
          },
        ],
        createdAt: answerData.createdAt || new Date(),
        updatedAt: answerData.updatedAt || new Date(),
      },
    };

    this.testSetup.getAnswerUseCase.execute.mockResolvedValueOnce(right(result));
    return result;
  }

  /**
   * Mock validation error
   */
  mockValidationError(details: string[] = ['ID must be a valid UUID']) {
    const error = new InvalidInputError('Validation failed', details);
    this.testSetup.getAnswerUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock answer not found error
   */
  mockAnswerNotFoundError() {
    const error = new AnswerNotFoundError();
    this.testSetup.getAnswerUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock repository error
   */
  mockRepositoryError(message = 'Database error') {
    const error = new RepositoryError(message);
    this.testSetup.getAnswerUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock unknown error
   */
  mockUnknownError(message = 'Unknown error') {
    const error = new Error(message);
    this.testSetup.getAnswerUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Execute controller getById and expect success
   */
  async executeGetByIdExpectSuccess(params: { id: string }, expectedAnswerData?: any) {
    const mockResult = this.mockGetAnswerSuccess(
      expectedAnswerData || { id: params.id },
    );
    const result = await this.testSetup.controller.getById(params);

    // Verify use case was called correctly
    expect(this.testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({ id: params.id });

    // Verify response format
    expect(result).toEqual(mockResult);

    return result;
  }

  /**
   * Execute controller getById and expect error
   */
  async executeGetByIdExpectError(
    params: { id: string },
    errorType: any,
    expectedExceptionType: any,
  ) {
    await expect(this.testSetup.controller.getById(params)).rejects.toThrow(
      expectedExceptionType,
    );

    // Verify use case was called
    expect(this.testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({ id: params.id });
  }

  /**
   * Execute controller getById and expect BadRequestException
   */
  async executeGetByIdExpectBadRequest(params: { id: string }, mockError?: () => any) {
    if (mockError) {
      mockError();
    } else {
      this.mockValidationError();
    }

    await this.executeGetByIdExpectError(
      params,
      InvalidInputError,
      BadRequestException,
    );
  }

  /**
   * Execute controller getById and expect NotFoundException
   */
  async executeGetByIdExpectNotFound(params: { id: string }) {
    this.mockAnswerNotFoundError();
    await this.executeGetByIdExpectError(
      params,
      AnswerNotFoundError,
      NotFoundException,
    );
  }

  /**
   * Execute controller getById and expect InternalServerErrorException
   */
  async executeGetByIdExpectInternalError(
    params: { id: string },
    errorType: 'repository' | 'unknown' = 'repository',
  ) {
    if (errorType === 'repository') {
      this.mockRepositoryError();
    } else {
      this.mockUnknownError();
    }

    await this.executeGetByIdExpectError(
      params,
      RepositoryError,
      InternalServerErrorException,
    );
  }

  /**
   * Verify response structure
   */
  verifyGetAnswerResponseStructure(
    response: any,
    expectedId: string,
    expectedData?: any,
  ) {
    expect(response).toHaveProperty('answer');

    const answer = response.answer;
    expect(answer).toHaveProperty('id', expectedId);
    expect(answer).toHaveProperty('explanation');
    expect(answer).toHaveProperty('questionId');
    expect(answer).toHaveProperty('translations');
    expect(answer).toHaveProperty('createdAt');
    expect(answer).toHaveProperty('updatedAt');

    // correctOptionId can be undefined for open questions
    expect(answer).toHaveProperty('correctOptionId');

    // Verify ID is UUID format
    expect(answer.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify questionId is UUID format
    expect(answer.questionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify correctOptionId is UUID format if present
    if (answer.correctOptionId) {
      expect(answer.correctOptionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }

    // Verify translations is array
    expect(Array.isArray(answer.translations)).toBe(true);

    // Verify each translation has required fields
    answer.translations.forEach((translation: any) => {
      expect(translation).toHaveProperty('locale');
      expect(translation).toHaveProperty('explanation');
      expect(typeof translation.locale).toBe('string');
      expect(typeof translation.explanation).toBe('string');
    });

    // Verify dates are Date objects
    expect(answer.createdAt).toBeInstanceOf(Date);
    expect(answer.updatedAt).toBeInstanceOf(Date);

    // Verify explanation is not empty
    expect(answer.explanation).toBeTruthy();
    expect(typeof answer.explanation).toBe('string');
    expect(answer.explanation.length).toBeGreaterThan(0);

    // Verify specific data if provided
    if (expectedData) {
      if (expectedData.explanation) 
        expect(answer.explanation).toBe(expectedData.explanation);
      if (expectedData.questionId) 
        expect(answer.questionId).toBe(expectedData.questionId);
      if (expectedData.correctOptionId !== undefined) 
        expect(answer.correctOptionId).toBe(expectedData.correctOptionId);
      if (expectedData.translations) 
        expect(answer.translations).toEqual(expectedData.translations);
    }
  }

  /**
   * Verify exception structure
   */
  verifyExceptionStructure(
    exception: any,
    expectedStatusCode: number,
    expectedError?: string,
    expectedMessage?: string,
  ) {
    expect(exception.response).toHaveProperty('statusCode', expectedStatusCode);

    if (expectedError) {
      expect(exception.response).toHaveProperty('error', expectedError);
    }

    if (expectedMessage) {
      expect(exception.response).toHaveProperty('message', expectedMessage);
    }
  }

  /**
   * Test all error scenarios for a given params
   */
  async testAllErrorScenarios(params: { id: string }) {
    // Test validation error
    await this.executeGetByIdExpectBadRequest(params);
    this.testSetup.resetMocks();

    // Test answer not found
    await this.executeGetByIdExpectNotFound(params);
    this.testSetup.resetMocks();

    // Test repository error
    await this.executeGetByIdExpectInternalError(params, 'repository');
    this.testSetup.resetMocks();

    // Test unknown error
    await this.executeGetByIdExpectInternalError(params, 'unknown');
    this.testSetup.resetMocks();
  }

  /**
   * Test with various invalid ID formats
   */
  async testInvalidIdFormats() {
    const invalidIds = [
      'invalid-uuid',
      'not-a-uuid-at-all',
      'short',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaa-aaaaaaaa',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@',
      '',
      'gggggggg-gggg-gggg-gggg-gggggggggggg',
    ];

    for (const invalidId of invalidIds) {
      await this.executeGetByIdExpectBadRequest({ id: invalidId });
      this.testSetup.resetMocks();
    }
  }

  /**
   * Generate unique UUID for testing
   */
  generateUniqueId(): string {
    // Generate a random UUID-like string for testing
    const chars = '0123456789abcdef';
    const sections = [8, 4, 4, 4, 12];

    return sections
      .map((length) => {
        return Array.from(
          { length },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join('');
      })
      .join('-');
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
   * Verify execution time is within limits
   */
  verifyExecutionTime(executionTime: number, maxTime: number) {
    expect(executionTime).toBeLessThan(maxTime);
  }

  /**
   * Test performance
   */
  async testGetAnswerPerformance(params: { id: string }, maxExecutionTime = 100) {
    const { result, executionTime } = await this.measureExecutionTime(
      async () => {
        return await this.executeGetByIdExpectSuccess(params);
      },
    );

    this.verifyExecutionTime(executionTime, maxExecutionTime);
    return { result, executionTime };
  }

  /**
   * Test concurrent requests
   */
  async testConcurrentGetAnswerRequests(
    paramsArray: { id: string }[],
    maxExecutionTime = 500,
  ) {
    // Mock responses for all IDs
    paramsArray.forEach((params, index) => {
      this.mockGetAnswerSuccess({
        id: params.id,
        explanation: `Concurrent answer ${index + 1}`,
        questionId: this.generateUniqueId(),
        correctOptionId: index % 2 === 0 ? this.generateUniqueId() : undefined,
      });
    });

    const { result, executionTime } = await this.measureExecutionTime(
      async () => {
        const promises = paramsArray.map((params) => 
          this.testSetup.controller.getById(params)
        );
        return await Promise.all(promises);
      },
    );

    this.verifyExecutionTime(executionTime, maxExecutionTime);

    // Verify all requests succeeded
    result.forEach((response, index) => {
      expect(response.answer.id).toBe(paramsArray[index].id);
    });

    return { result, executionTime };
  }

  /**
   * Reset all mocks and state
   */
  reset() {
    this.testSetup.resetMocks();
  }
}