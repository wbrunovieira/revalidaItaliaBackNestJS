// src/infra/controllers/tests/attempt/shared/attempt-controller-test-setup.ts
import { vi } from 'vitest';
import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '@/domain/assessment/application/use-cases/submit-answer.use-case';
import { SubmitAttemptUseCase } from '@/domain/assessment/application/use-cases/submit-attempt.use-case';
import { GetAttemptResultsUseCase } from '@/domain/assessment/application/use-cases/get-attempt-results.use-case';
import { ReviewOpenAnswerUseCase } from '@/domain/assessment/application/use-cases/review-open-answer.use-case';
import { ListAttemptsUseCase } from '@/domain/assessment/application/use-cases/list-attempts.use-case';
import { ListPendingReviewsUseCase } from '@/domain/assessment/application/use-cases/list-pending-reviews.use-case';
import { AttemptController } from '../../../attempt.controller';

export class MockStartAttemptUseCase {
  execute = vi.fn();
}

export class MockSubmitAnswerUseCase {
  execute = vi.fn();
}

export class MockSubmitAttemptUseCase {
  execute = vi.fn();
}

export class MockGetAttemptResultsUseCase {
  execute = vi.fn();
}

export class MockReviewOpenAnswerUseCase {
  execute = vi.fn();
}

export class MockListAttemptsUseCase {
  execute = vi.fn();
}

export class MockListPendingReviewsUseCase {
  execute = vi.fn();
}

export class AttemptControllerTestSetup {
  public startAttemptUseCase: MockStartAttemptUseCase;
  public submitAnswerUseCase: MockSubmitAnswerUseCase;
  public submitAttemptUseCase: MockSubmitAttemptUseCase;
  public getAttemptResultsUseCase: MockGetAttemptResultsUseCase;
  public reviewOpenAnswerUseCase: MockReviewOpenAnswerUseCase;
  public listAttemptsUseCase: MockListAttemptsUseCase;
  public listPendingReviewsUseCase: MockListPendingReviewsUseCase;
  public controller: AttemptController;

  constructor() {
    this.startAttemptUseCase = new MockStartAttemptUseCase();
    this.submitAnswerUseCase = new MockSubmitAnswerUseCase();
    this.submitAttemptUseCase = new MockSubmitAttemptUseCase();
    this.getAttemptResultsUseCase = new MockGetAttemptResultsUseCase();
    this.reviewOpenAnswerUseCase = new MockReviewOpenAnswerUseCase();
    this.listAttemptsUseCase = new MockListAttemptsUseCase();
    this.listPendingReviewsUseCase = new MockListPendingReviewsUseCase();
    this.controller = new AttemptController(
      this.startAttemptUseCase as any,
      this.submitAnswerUseCase as any,
      this.submitAttemptUseCase as any,
      this.getAttemptResultsUseCase as any,
      this.reviewOpenAnswerUseCase as any,
      this.listAttemptsUseCase as any,
      this.listPendingReviewsUseCase as any,
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
      submitAttemptUseCase: this.submitAttemptUseCase,
      getAttemptResultsUseCase: this.getAttemptResultsUseCase,
      reviewOpenAnswerUseCase: this.reviewOpenAnswerUseCase,
      listAttemptsUseCase: this.listAttemptsUseCase,
      listPendingReviewsUseCase: this.listPendingReviewsUseCase,
    };
  }
}
