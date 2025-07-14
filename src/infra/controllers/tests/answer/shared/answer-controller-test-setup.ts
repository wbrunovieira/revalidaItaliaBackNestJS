// src/infra/controllers/tests/answer/shared/answer-controller-test-setup.ts
import { vi } from 'vitest';
import { GetAnswerUseCase } from '@/domain/assessment/application/use-cases/get-answer.use-case';
import { CreateAnswerUseCase } from '@/domain/assessment/application/use-cases/create-answer.use-case';
import { AnswerController } from '../../../answer.controller';

export class MockGetAnswerUseCase {
  execute = vi.fn();
}

export class MockCreateAnswerUseCase {
  execute = vi.fn();
}

export class AnswerControllerTestSetup {
  public getAnswerUseCase: MockGetAnswerUseCase;
  public createAnswerUseCase: MockCreateAnswerUseCase;
  public controller: AnswerController;

  constructor() {
    this.getAnswerUseCase = new MockGetAnswerUseCase();
    this.createAnswerUseCase = new MockCreateAnswerUseCase();
    this.controller = new AnswerController(
      this.getAnswerUseCase as any,
      this.createAnswerUseCase as any,
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
      getAnswerUseCase: this.getAnswerUseCase,
      createAnswerUseCase: this.createAnswerUseCase,
    };
  }
}
