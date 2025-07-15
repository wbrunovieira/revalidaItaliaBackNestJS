// src/domain/assessment/application/use-cases/list-questions-by-assessment.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { ListQuestionsByAssessmentRequest } from '../dtos/list-questions-by-assessment-request.dto';
import { ListQuestionsByAssessmentResponse, QuestionResponse } from '../dtos/list-questions-by-assessment-response.dto';
import { listQuestionsByAssessmentSchema } from './validations/list-questions-by-assessment.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';

type ListQuestionsByAssessmentUseCaseResponse = Either<
  | InvalidInputError
  | AssessmentNotFoundError
  | RepositoryError,
  ListQuestionsByAssessmentResponse
>;

@Injectable()
export class ListQuestionsByAssessmentUseCase {
  constructor(
    @Inject('QuestionRepository')
    private questionRepository: IQuestionRepository,
    @Inject('QuestionOptionRepository')
    private questionOptionRepository: IQuestionOptionRepository,
    @Inject('AssessmentRepository')
    private assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(request: ListQuestionsByAssessmentRequest): Promise<ListQuestionsByAssessmentUseCaseResponse> {
    // Validate input
    const validation = listQuestionsByAssessmentSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { assessmentId } = validation.data;

    try {
      // Check if assessment exists
      const assessmentResult = await this.assessmentRepository.findById(assessmentId);
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      // Get questions from assessment
      const questionsResult = await this.questionRepository.findByAssessmentId(assessmentId);
      if (questionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch questions'));
      }

      const questions = questionsResult.value;

      // Get question IDs for fetching options
      const questionIds = questions.map(q => q.id.toString());

      // Get all options for all questions in one query
      const optionsResult = await this.questionOptionRepository.findByQuestionIds(questionIds);
      if (optionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch question options'));
      }

      const allOptions = optionsResult.value;

      // Group options by question ID
      const optionsByQuestionId = new Map<string, typeof allOptions>();
      allOptions.forEach(option => {
        const questionId = option.questionId.toString();
        if (!optionsByQuestionId.has(questionId)) {
          optionsByQuestionId.set(questionId, []);
        }
        optionsByQuestionId.get(questionId)!.push(option);
      });

      // Build response
      const questionsResponse: QuestionResponse[] = questions.map(question => ({
        id: question.id.toString(),
        text: question.text,
        type: question.type.getValue() as 'MULTIPLE_CHOICE' | 'OPEN',
        options: (optionsByQuestionId.get(question.id.toString()) || []).map(option => ({
          id: option.id.toString(),
          text: option.text,
        })),
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      }));

      return right({
        questions: questionsResponse,
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}