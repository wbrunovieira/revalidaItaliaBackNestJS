// src/domain/assessment/application/use-cases/list-questions-by-assessment.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { ListQuestionsByAssessmentRequest } from '../dtos/list-questions-by-assessment-request.dto';
import {
  ListQuestionsByAssessmentResponse,
  QuestionResponse,
} from '../dtos/list-questions-by-assessment-response.dto';
import { listQuestionsByAssessmentSchema } from './validations/list-questions-by-assessment.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';

type ListQuestionsByAssessmentUseCaseResponse = Either<
  InvalidInputError | AssessmentNotFoundError | RepositoryError,
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
    @Inject('ArgumentRepository')
    private argumentRepository: IArgumentRepository,
  ) {}

  async execute(
    request: ListQuestionsByAssessmentRequest,
  ): Promise<ListQuestionsByAssessmentUseCaseResponse> {
    // Validate input
    const validation = listQuestionsByAssessmentSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { assessmentId } = validation.data;

    try {
      // Check if assessment exists
      const assessmentResult =
        await this.assessmentRepository.findById(assessmentId);
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      // Get questions from assessment
      const questionsResult =
        await this.questionRepository.findByAssessmentId(assessmentId);
      if (questionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch questions'));
      }

      const questions = questionsResult.value;

      // Get question IDs for fetching options
      const questionIds = questions.map((q) => q.id.toString());

      // Get all options for all questions in one query
      const optionsResult =
        await this.questionOptionRepository.findByQuestionIds(questionIds);
      if (optionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch question options'));
      }

      const allOptions = optionsResult.value;

      // Group options by question ID
      const optionsByQuestionId = new Map<string, typeof allOptions>();
      allOptions.forEach((option) => {
        const questionId = option.questionId.toString();
        if (!optionsByQuestionId.has(questionId)) {
          optionsByQuestionId.set(questionId, []);
        }
        optionsByQuestionId.get(questionId)!.push(option);
      });

      const assessment = assessmentResult.value;

      // Fetch arguments by ID for all questions that have argumentId
      const argumentsByIdMap = new Map<string, string>();
      const argumentIds = questions
        .map((q) => q.argumentId?.toString())
        .filter(Boolean) as string[];

      // Fetch each argument individually by ID
      for (const argumentId of argumentIds) {
        const argResult = await this.argumentRepository.findById(argumentId);
        if (argResult.isRight()) {
          argumentsByIdMap.set(argumentId, argResult.value.title);
        }
      }

      // Build response
      const questionsResponse: QuestionResponse[] = questions.map(
        (question) => {
          const argumentId = question.argumentId?.toString();
          const argumentName = argumentId
            ? argumentsByIdMap.get(argumentId) || null
            : null;

          const questionResponse: QuestionResponse = {
            id: question.id.toString(),
            text: question.text,
            type: question.type.getValue() as 'MULTIPLE_CHOICE' | 'OPEN',
            argumentId,
            argumentName,
            options: (
              optionsByQuestionId.get(question.id.toString()) || []
            ).map((option) => ({
              id: option.id.toString(),
              text: option.text,
            })),
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          };

          return questionResponse;
        },
      );

      return right({
        assessment: {
          id: assessment.id.toString(),
          slug: assessment.slug,
          title: assessment.title,
          description: assessment.description,
          type: assessment.type,
          quizPosition: assessment.quizPosition,
          passingScore: assessment.passingScore,
          timeLimitInMinutes: assessment.timeLimitInMinutes,
          randomizeQuestions: assessment.randomizeQuestions,
          randomizeOptions: assessment.randomizeOptions,
          lessonId: assessment.lessonId?.toString(),
          createdAt: assessment.createdAt,
          updatedAt: assessment.updatedAt,
        },
        questions: questionsResponse,
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
