// src/infra/controllers/tests/attempt/shared/attempt-controller-test-helpers.ts
import { expect } from 'vitest';
import { StartAttemptResponse } from '@/domain/assessment/application/dtos/start-attempt-response.dto';

export class AttemptControllerTestHelpers {
  /**
   * Verifies that a StartAttemptResponse has the correct structure
   */
  static verifyStartAttemptResponseStructure(response: StartAttemptResponse): void {
    expect(response).toHaveProperty('attempt');
    expect(response.attempt).toHaveProperty('id');
    expect(response.attempt).toHaveProperty('status');
    expect(response.attempt).toHaveProperty('startedAt');
    expect(response.attempt).toHaveProperty('userId');
    expect(response.attempt).toHaveProperty('assessmentId');
    expect(response.attempt).toHaveProperty('createdAt');
    expect(response.attempt).toHaveProperty('updatedAt');

    // Verify data types
    expect(typeof response.attempt.id).toBe('string');
    expect(['IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED']).toContain(response.attempt.status);
    expect(response.attempt.startedAt).toBeInstanceOf(Date);
    expect(typeof response.attempt.identityId).toBe('string');
    expect(typeof response.attempt.assessmentId).toBe('string');
    expect(response.attempt.createdAt).toBeInstanceOf(Date);
    expect(response.attempt.updatedAt).toBeInstanceOf(Date);

    // Verify UUID format for IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(response.attempt.id).toMatch(uuidRegex);
    expect(response.attempt.identityId).toMatch(uuidRegex);
    expect(response.attempt.assessmentId).toMatch(uuidRegex);
  }

  /**
   * Verifies that a StartAttemptResponse has time limit properties when expected
   */
  static verifyStartAttemptResponseWithTimeLimit(response: StartAttemptResponse): void {
    this.verifyStartAttemptResponseStructure(response);
    
    expect(response.attempt).toHaveProperty('timeLimitExpiresAt');
    expect(response.attempt.timeLimitExpiresAt).toBeInstanceOf(Date);
    
    // Time limit should be after start time
    expect(response.attempt.timeLimitExpiresAt!.getTime()).toBeGreaterThan(
      response.attempt.startedAt.getTime()
    );
  }

  /**
   * Verifies that an error response has the correct structure
   */
  static verifyErrorResponseStructure(
    error: any, 
    expectedError: string, 
    expectedMessage: string
  ): void {
    expect(error).toHaveProperty('error', expectedError);
    expect(error).toHaveProperty('message', expectedMessage);
  }

  /**
   * Verifies that an error response has validation details
   */
  static verifyValidationErrorResponse(error: any): void {
    expect(error).toHaveProperty('error', 'INVALID_INPUT');
    expect(error).toHaveProperty('message', 'Invalid input data');
    expect(error).toHaveProperty('details');
  }

  /**
   * Creates a mock Date that can be used consistently in tests
   */
  static createMockDate(dateString = '2023-01-01T10:00:00Z'): Date {
    return new Date(dateString);
  }

  /**
   * Verifies that two dates are within a reasonable time difference (for testing async operations)
   */
  static verifyDateIsRecent(date: Date, maxDifferenceMs = 5000): void {
    const now = new Date();
    const difference = Math.abs(now.getTime() - date.getTime());
    expect(difference).toBeLessThan(maxDifferenceMs);
  }

  /**
   * Verifies that use case was called with correct parameters
   */
  static verifyUseCaseCalledWith(
    mockUseCase: any,
    expectedUserId: string,
    expectedAssessmentId: string
  ): void {
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      userId: expectedUserId,
      assessmentId: expectedAssessmentId,
    });
  }

  /**
   * Verifies that use case was called exactly once
   */
  static verifyUseCaseCalledOnce(mockUseCase: any): void {
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
  }

  /**
   * Verifies that use case was not called
   */
  static verifyUseCaseNotCalled(mockUseCase: any): void {
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  }

  /**
   * Captures an exception thrown by a function for testing purposes
   */
  async captureException(fn: () => Promise<any>): Promise<any> {
    try {
      await fn();
      throw new Error('Expected function to throw an exception');
    } catch (error) {
      return error;
    }
  }
}