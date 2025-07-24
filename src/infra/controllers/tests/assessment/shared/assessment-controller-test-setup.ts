// src/infra/controllers/tests/assessment/shared/assessment-controller-test-setup.ts

import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AssessmentController } from '@/infra/controllers/assessment.controller';
import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { UpdateAssessmentUseCase } from '@/domain/assessment/application/use-cases/update-assessment.use-case';
import { ListAssessmentsUseCase } from '@/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '@/domain/assessment/application/use-cases/get-assessment.use-case';
import { DeleteAssessmentUseCase } from '@/domain/assessment/application/use-cases/delete-assessment.use-case';
import { ListQuestionsByAssessmentUseCase } from '@/domain/assessment/application/use-cases/list-questions-by-assessment.use-case';
import { GetQuestionsDetailedUseCase } from '@/domain/assessment/application/use-cases/get-questions-detailed.use-case';

export interface AssessmentControllerTestContext {
  controller: AssessmentController;
  createAssessmentUseCase: CreateAssessmentUseCase;
  updateAssessmentUseCase: UpdateAssessmentUseCase;
  listAssessmentsUseCase: ListAssessmentsUseCase;
  getAssessmentUseCase: GetAssessmentUseCase;
  deleteAssessmentUseCase: DeleteAssessmentUseCase;
  listQuestionsByAssessmentUseCase: ListQuestionsByAssessmentUseCase;
  getQuestionsDetailedUseCase: GetQuestionsDetailedUseCase;
}

export async function setupAssessmentControllerTest(): Promise<AssessmentControllerTestContext> {
  const createAssessmentUseCaseMock = {
    execute: vi.fn(),
  };

  const updateAssessmentUseCaseMock = {
    execute: vi.fn(),
  };

  const listAssessmentsUseCaseMock = {
    execute: vi.fn(),
  };

  const getAssessmentUseCaseMock = {
    execute: vi.fn(),
  };

  const deleteAssessmentUseCaseMock = {
    execute: vi.fn(),
  };

  const listQuestionsByAssessmentUseCaseMock = {
    execute: vi.fn(),
  };

  const getQuestionsDetailedUseCaseMock = {
    execute: vi.fn(),
  };

  const module: TestingModule = await Test.createTestingModule({
    controllers: [AssessmentController],
    providers: [
      {
        provide: CreateAssessmentUseCase,
        useValue: createAssessmentUseCaseMock,
      },
      {
        provide: UpdateAssessmentUseCase,
        useValue: updateAssessmentUseCaseMock,
      },
      {
        provide: ListAssessmentsUseCase,
        useValue: listAssessmentsUseCaseMock,
      },
      {
        provide: GetAssessmentUseCase,
        useValue: getAssessmentUseCaseMock,
      },
      {
        provide: DeleteAssessmentUseCase,
        useValue: deleteAssessmentUseCaseMock,
      },
      {
        provide: ListQuestionsByAssessmentUseCase,
        useValue: listQuestionsByAssessmentUseCaseMock,
      },
      {
        provide: GetQuestionsDetailedUseCase,
        useValue: getQuestionsDetailedUseCaseMock,
      },
    ],
  }).compile();

  const controller = module.get<AssessmentController>(AssessmentController);

  return {
    controller,
    createAssessmentUseCase: createAssessmentUseCaseMock as any,
    updateAssessmentUseCase: updateAssessmentUseCaseMock as any,
    listAssessmentsUseCase: listAssessmentsUseCaseMock as any,
    getAssessmentUseCase: getAssessmentUseCaseMock as any,
    deleteAssessmentUseCase: deleteAssessmentUseCaseMock as any,
    listQuestionsByAssessmentUseCase:
      listQuestionsByAssessmentUseCaseMock as any,
    getQuestionsDetailedUseCase: getQuestionsDetailedUseCaseMock as any,
  };
}
