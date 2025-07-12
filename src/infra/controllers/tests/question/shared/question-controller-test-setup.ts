// src/infra/controllers/tests/question/shared/question-controller-test-setup.ts
import { vi } from 'vitest';
import { CreateQuestionUseCase } from '@/domain/assessment/application/use-cases/create-question.use-case';
import { QuestionController } from '../../../question.controller';

export class MockCreateQuestionUseCase {
  execute = vi.fn();
}
export class MockGetQuestionUseCase {
  execute = vi.fn();
}

export class QuestionControllerTestSetup {
  public createUseCase: MockCreateQuestionUseCase;
  public getUseCase: MockGetQuestionUseCase;
  public controller: QuestionController;

  constructor() {
    this.createUseCase = new MockCreateQuestionUseCase();
    this.getUseCase = new MockGetQuestionUseCase();
    this.controller = new QuestionController(
      this.createUseCase as any,
      this.getUseCase as any,
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
      createUseCase: this.createUseCase,
    };
  }
}
