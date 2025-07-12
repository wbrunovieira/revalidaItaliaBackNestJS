// src/infra/controllers/tests/question/shared/question-controller-test-helpers.ts
import { left, right } from '@/core/either';
import { QuestionControllerTestSetup } from './question-controller-test-setup';
import { CreateQuestionDto } from '@/domain/assessment/application/dtos/create-question.dto';
import { GetQuestionRequest } from '@/domain/assessment/application/dtos/get-question-request.dto';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { DuplicateQuestionError } from '@/domain/assessment/application/use-cases/errors/duplicate-question-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { QuestionTypeMismatchError } from '@/domain/assessment/application/use-cases/errors/question-type-mismatch-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class QuestionControllerTestHelpers {
  constructor(private readonly testSetup: QuestionControllerTestSetup) {}

  /**
   * Mock successful question creation
   */
  mockCreateSuccess(questionData: any) {
    const result = {
      question: {
        id: this.generateUniqueId(),
        text: questionData.text,
        type: questionData.type,
        assessmentId: questionData.assessmentId,
        argumentId: questionData.argumentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    this.testSetup.createUseCase.execute.mockResolvedValueOnce(right(result));
    return result;
  }

  /**
   * Mock validation error
   */
  mockValidationError(details: string[] = ['Validation failed']) {
    const error = new InvalidInputError('Invalid input data', details);
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock duplicate question error
   */
  mockDuplicateError() {
    const error = new DuplicateQuestionError();
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock assessment not found error
   */
  mockAssessmentNotFoundError() {
    const error = new AssessmentNotFoundError();
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock argument not found error
   */
  mockArgumentNotFoundError() {
    const error = new ArgumentNotFoundError();
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock question type mismatch error
   */
  mockTypeMismatchError(assessmentType: string, recommendedType: string) {
    const error = new QuestionTypeMismatchError(assessmentType, recommendedType);
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock repository error
   */
  mockRepositoryError(message = 'Database error') {
    const error = new RepositoryError(message);
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock unknown error
   */
  mockUnknownError(message = 'Unknown error') {
    const error = new Error(message);
    this.testSetup.createUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Execute controller create and expect success
   */
  async executeCreateExpectSuccess(dto: CreateQuestionDto) {
    const mockResult = this.mockCreateSuccess(dto);
    const result = await this.testSetup.controller.create(dto);

    // Verify use case was called correctly
    expect(this.testSetup.createUseCase.execute).toHaveBeenCalledWith({
      text: dto.text,
      type: dto.type,
      assessmentId: dto.assessmentId,
      argumentId: dto.argumentId,
    });

    // Verify response format
    expect(result).toEqual({
      success: true,
      question: mockResult.question,
    });

    return result;
  }

  /**
   * Execute controller create and expect error
   */
  async executeCreateExpectError(
    dto: CreateQuestionDto,
    errorType: any,
    expectedExceptionType: any,
  ) {
    await expect(this.testSetup.controller.create(dto)).rejects.toThrow(
      expectedExceptionType,
    );

    // Verify use case was called
    expect(this.testSetup.createUseCase.execute).toHaveBeenCalledWith({
      text: dto.text,
      type: dto.type,
      assessmentId: dto.assessmentId,
      argumentId: dto.argumentId,
    });
  }

  /**
   * Execute controller create and expect BadRequestException
   */
  async executeCreateExpectBadRequest(dto: CreateQuestionDto, mockError?: () => any) {
    if (mockError) {
      mockError();
    } else {
      this.mockValidationError();
    }

    await this.executeCreateExpectError(dto, InvalidInputError, BadRequestException);
  }

  /**
   * Execute controller create and expect ConflictException
   */
  async executeCreateExpectConflict(dto: CreateQuestionDto) {
    this.mockDuplicateError();
    await this.executeCreateExpectError(dto, DuplicateQuestionError, ConflictException);
  }

  /**
   * Execute controller create and expect NotFoundException
   */
  async executeCreateExpectNotFound(dto: CreateQuestionDto, errorType: 'assessment' | 'argument' = 'assessment') {
    if (errorType === 'assessment') {
      this.mockAssessmentNotFoundError();
      await this.executeCreateExpectError(dto, AssessmentNotFoundError, NotFoundException);
    } else {
      this.mockArgumentNotFoundError();
      await this.executeCreateExpectError(dto, ArgumentNotFoundError, NotFoundException);
    }
  }

  /**
   * Execute controller create and expect InternalServerErrorException
   */
  async executeCreateExpectInternalError(dto: CreateQuestionDto, errorType: 'repository' | 'unknown' = 'repository') {
    if (errorType === 'repository') {
      this.mockRepositoryError();
    } else {
      this.mockUnknownError();
    }

    await this.executeCreateExpectError(dto, RepositoryError, InternalServerErrorException);
  }

  /**
   * Verify response structure
   */
  verifySuccessResponseStructure(response: any, expectedDto: CreateQuestionDto) {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('question');
    
    const question = response.question;
    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('text', expectedDto.text);
    expect(question).toHaveProperty('type', expectedDto.type);
    expect(question).toHaveProperty('assessmentId', expectedDto.assessmentId);
    expect(question).toHaveProperty('createdAt');
    expect(question).toHaveProperty('updatedAt');

    if (expectedDto.argumentId) {
      expect(question).toHaveProperty('argumentId', expectedDto.argumentId);
    }

    // Verify ID is UUID format
    expect(question.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    // Verify dates are Date objects
    expect(question.createdAt).toBeInstanceOf(Date);
    expect(question.updatedAt).toBeInstanceOf(Date);
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
   * Test all error scenarios for a given DTO
   */
  async testAllErrorScenarios(baseDto: CreateQuestionDto) {
    // Test validation error
    await this.executeCreateExpectBadRequest(baseDto);
    this.testSetup.resetMocks();

    // Test duplicate error
    await this.executeCreateExpectConflict(baseDto);
    this.testSetup.resetMocks();

    // Test assessment not found
    await this.executeCreateExpectNotFound(baseDto, 'assessment');
    this.testSetup.resetMocks();

    // Test argument not found (if argumentId is provided)
    if (baseDto.argumentId) {
      await this.executeCreateExpectNotFound(baseDto, 'argument');
      this.testSetup.resetMocks();
    }

    // Test type mismatch
    this.mockTypeMismatchError('QUIZ', 'MULTIPLE_CHOICE');
    await this.executeCreateExpectError(baseDto, QuestionTypeMismatchError, BadRequestException);
    this.testSetup.resetMocks();

    // Test repository error
    await this.executeCreateExpectInternalError(baseDto, 'repository');
    this.testSetup.resetMocks();

    // Test unknown error
    await this.executeCreateExpectInternalError(baseDto, 'unknown');
    this.testSetup.resetMocks();
  }

  /**
   * Generate unique question text
   */
  generateUniqueText(prefix = 'Test question'): string {
    return `${prefix} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique UUID for testing
   */
  generateUniqueId(): string {
    // Generate a random UUID-like string for testing
    const chars = '0123456789abcdef';
    const sections = [8, 4, 4, 4, 12];
    
    return sections.map(length => {
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }).join('-');
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
   * GetQuestion helpers
   */

  /**
   * Mock successful question retrieval
   */
  mockGetQuestionSuccess(questionData: any) {
    const result = {
      question: {
        id: questionData.id,
        text: questionData.text || 'What is the capital of Brazil?',
        type: questionData.type || 'MULTIPLE_CHOICE',
        assessmentId: questionData.assessmentId || this.generateUniqueId(),
        argumentId: questionData.argumentId,
        createdAt: questionData.createdAt || new Date(),
        updatedAt: questionData.updatedAt || new Date(),
      },
    };

    this.testSetup.getUseCase.execute.mockResolvedValueOnce(right(result));
    return result;
  }

  /**
   * Mock GetQuestion validation error
   */
  mockGetQuestionValidationError(details: string[] = ['ID must be a valid UUID']) {
    const error = new InvalidInputError('Validation failed', details);
    this.testSetup.getUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock question not found error
   */
  mockQuestionNotFoundError() {
    const error = new QuestionNotFoundError();
    this.testSetup.getUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock GetQuestion repository error
   */
  mockGetQuestionRepositoryError(message = 'Database error') {
    const error = new RepositoryError(message);
    this.testSetup.getUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Mock GetQuestion unknown error
   */
  mockGetQuestionUnknownError(message = 'Unknown error') {
    const error = new Error(message);
    this.testSetup.getUseCase.execute.mockResolvedValueOnce(left(error));
    return error;
  }

  /**
   * Execute controller getById and expect success
   */
  async executeGetByIdExpectSuccess(id: string, expectedQuestionData?: any) {
    const mockResult = this.mockGetQuestionSuccess(expectedQuestionData || { id });
    const result = await this.testSetup.controller.getById(id);

    // Verify use case was called correctly
    expect(this.testSetup.getUseCase.execute).toHaveBeenCalledWith({ id });

    // Verify response format
    expect(result).toEqual({
      success: true,
      question: mockResult.question,
    });

    return result;
  }

  /**
   * Execute controller getById and expect error
   */
  async executeGetByIdExpectError(
    id: string,
    errorType: any,
    expectedExceptionType: any,
  ) {
    await expect(this.testSetup.controller.getById(id)).rejects.toThrow(
      expectedExceptionType,
    );

    // Verify use case was called
    expect(this.testSetup.getUseCase.execute).toHaveBeenCalledWith({ id });
  }

  /**
   * Execute controller getById and expect BadRequestException
   */
  async executeGetByIdExpectBadRequest(id: string, mockError?: () => any) {
    if (mockError) {
      mockError();
    } else {
      this.mockGetQuestionValidationError();
    }

    await this.executeGetByIdExpectError(id, InvalidInputError, BadRequestException);
  }

  /**
   * Execute controller getById and expect NotFoundException
   */
  async executeGetByIdExpectNotFound(id: string) {
    this.mockQuestionNotFoundError();
    await this.executeGetByIdExpectError(id, QuestionNotFoundError, NotFoundException);
  }

  /**
   * Execute controller getById and expect InternalServerErrorException
   */
  async executeGetByIdExpectInternalError(id: string, errorType: 'repository' | 'unknown' = 'repository') {
    if (errorType === 'repository') {
      this.mockGetQuestionRepositoryError();
    } else {
      this.mockGetQuestionUnknownError();
    }

    await this.executeGetByIdExpectError(id, RepositoryError, InternalServerErrorException);
  }

  /**
   * Verify GetQuestion response structure
   */
  verifyGetQuestionResponseStructure(response: any, expectedId: string, expectedData?: any) {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('question');
    
    const question = response.question;
    expect(question).toHaveProperty('id', expectedId);
    expect(question).toHaveProperty('text');
    expect(question).toHaveProperty('type');
    expect(question).toHaveProperty('assessmentId');
    expect(question).toHaveProperty('createdAt');
    expect(question).toHaveProperty('updatedAt');

    // Verify type is valid
    expect(['MULTIPLE_CHOICE', 'OPEN']).toContain(question.type);

    // Verify ID is UUID format
    expect(question.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    // Verify assessmentId is UUID format
    expect(question.assessmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify argumentId if present
    if (question.argumentId) {
      expect(question.argumentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
    
    // Verify dates are Date objects
    expect(question.createdAt).toBeInstanceOf(Date);
    expect(question.updatedAt).toBeInstanceOf(Date);

    // Verify text is not empty
    expect(question.text).toBeTruthy();
    expect(typeof question.text).toBe('string');
    expect(question.text.length).toBeGreaterThan(0);

    // Verify specific data if provided
    if (expectedData) {
      if (expectedData.text) expect(question.text).toBe(expectedData.text);
      if (expectedData.type) expect(question.type).toBe(expectedData.type);
      if (expectedData.assessmentId) expect(question.assessmentId).toBe(expectedData.assessmentId);
      if (expectedData.argumentId) expect(question.argumentId).toBe(expectedData.argumentId);
    }
  }

  /**
   * Test all GetQuestion error scenarios for a given ID
   */
  async testAllGetQuestionErrorScenarios(id: string) {
    // Test validation error
    await this.executeGetByIdExpectBadRequest(id);
    this.testSetup.resetMocks();

    // Test question not found
    await this.executeGetByIdExpectNotFound(id);
    this.testSetup.resetMocks();

    // Test repository error
    await this.executeGetByIdExpectInternalError(id, 'repository');
    this.testSetup.resetMocks();

    // Test unknown error
    await this.executeGetByIdExpectInternalError(id, 'unknown');
    this.testSetup.resetMocks();
  }

  /**
   * Test GetQuestion with various invalid ID formats
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
      await this.executeGetByIdExpectBadRequest(invalidId);
      this.testSetup.resetMocks();
    }
  }

  /**
   * Test GetQuestion performance
   */
  async testGetQuestionPerformance(id: string, maxExecutionTime = 100) {
    const { result, executionTime } = await this.measureExecutionTime(async () => {
      return await this.executeGetByIdExpectSuccess(id);
    });

    this.verifyExecutionTime(executionTime, maxExecutionTime);
    return { result, executionTime };
  }

  /**
   * Test concurrent GetQuestion requests
   */
  async testConcurrentGetQuestionRequests(ids: string[], maxExecutionTime = 500) {
    // Mock responses for all IDs
    ids.forEach((id, index) => {
      this.mockGetQuestionSuccess({
        id,
        text: `Concurrent question ${index + 1}`,
        type: index % 2 === 0 ? 'MULTIPLE_CHOICE' : 'OPEN',
      });
    });

    const { result, executionTime } = await this.measureExecutionTime(async () => {
      const promises = ids.map(id => this.testSetup.controller.getById(id));
      return await Promise.all(promises);
    });

    this.verifyExecutionTime(executionTime, maxExecutionTime);

    // Verify all requests succeeded
    result.forEach((response, index) => {
      expect(response.success).toBe(true);
      expect(response.question.id).toBe(ids[index]);
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