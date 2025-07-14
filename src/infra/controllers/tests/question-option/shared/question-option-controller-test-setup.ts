// src/infra/controllers/tests/question-option/shared/question-option-controller-test-setup.ts
import { vi } from 'vitest';
import { CreateQuestionOptionUseCase } from '@/domain/assessment/application/use-cases/create-question-option.use-case';
import { QuestionOptionController } from '../../../question-option.controller';

export class MockCreateQuestionOptionUseCase {
  execute = vi.fn();
}

export class QuestionOptionControllerTestSetup {
  public createQuestionOptionUseCase: MockCreateQuestionOptionUseCase;
  public controller: QuestionOptionController;

  constructor() {
    this.createQuestionOptionUseCase = new MockCreateQuestionOptionUseCase();
    this.controller = new QuestionOptionController(
      this.createQuestionOptionUseCase as any,
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
      createQuestionOptionUseCase: this.createQuestionOptionUseCase,
    };
  }
}