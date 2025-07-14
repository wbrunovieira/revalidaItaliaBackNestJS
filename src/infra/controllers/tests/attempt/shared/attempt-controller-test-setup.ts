// src/infra/controllers/tests/attempt/shared/attempt-controller-test-setup.ts
import { vi } from 'vitest';
import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '@/domain/assessment/application/use-cases/submit-answer.use-case';
import { AttemptController } from '../../../attempt.controller';

export class MockStartAttemptUseCase {
  execute = vi.fn();
}

export class MockSubmitAnswerUseCase {
  execute = vi.fn();
}

export class AttemptControllerTestSetup {
  public startAttemptUseCase: MockStartAttemptUseCase;
  public submitAnswerUseCase: MockSubmitAnswerUseCase;
  public controller: AttemptController;

  constructor() {
    this.startAttemptUseCase = new MockStartAttemptUseCase();
    this.submitAnswerUseCase = new MockSubmitAnswerUseCase();
    this.controller = new AttemptController(
      this.startAttemptUseCase as any,
      this.submitAnswerUseCase as any,
    );
  }

  /**
   * Reset all mocks
   */
  resetMocks(): void {
    vi.clearAllMocks();
  }

  /**
   * Get fresh instances for each test
   */
  getTestInstances() {
    return {
      controller: this.controller,
      startAttemptUseCase: this.startAttemptUseCase,
      submitAnswerUseCase: this.submitAnswerUseCase,
    };
  }
}