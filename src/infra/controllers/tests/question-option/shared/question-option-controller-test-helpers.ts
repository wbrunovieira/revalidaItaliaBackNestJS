// src/infra/controllers/tests/question-option/shared/question-option-controller-test-helpers.ts
import { QuestionOptionControllerTestSetup } from './question-option-controller-test-setup';
import { CreateQuestionOptionDto } from '@/domain/assessment/application/dtos/create-question-option.dto';

export class QuestionOptionControllerTestHelpers {
  constructor(private testSetup: QuestionOptionControllerTestSetup) {}

  /**
   * Helper to create a question option
   */
  async createQuestionOption(params: {
    questionId: string;
    dto: CreateQuestionOptionDto;
  }) {
    const { questionId, dto } = params;
    return await this.testSetup.controller.createOption(questionId, dto);
  }

  /**
   * Helper to create a question option with success response
   */
  async createQuestionOptionWithSuccess(params: {
    questionId: string;
    dto: CreateQuestionOptionDto;
    expectedResponse: any;
  }) {
    const { questionId, dto, expectedResponse } = params;
    
    // Mock successful response
    this.testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce({
      isRight: () => true,
      value: expectedResponse,
    });

    return await this.testSetup.controller.createOption(questionId, dto);
  }

  /**
   * Helper to create a question option with error response
   */
  async createQuestionOptionWithError(params: {
    questionId: string;
    dto: CreateQuestionOptionDto;
    error: any;
  }) {
    const { questionId, dto, error } = params;
    
    // Mock error response
    this.testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce({
      isLeft: () => true,
      value: error,
    });

    return await this.testSetup.controller.createOption(questionId, dto);
  }

  /**
   * Helper to verify use case was called with correct parameters
   */
  expectUseCaseToHaveBeenCalledWith(params: {
    text: string;
    questionId: string;
  }) {
    expect(this.testSetup.createQuestionOptionUseCase.execute).toHaveBeenCalledWith(params);
  }

  /**
   * Helper to verify use case was called exactly once
   */
  expectUseCaseToHaveBeenCalledOnce() {
    expect(this.testSetup.createQuestionOptionUseCase.execute).toHaveBeenCalledTimes(1);
  }
}