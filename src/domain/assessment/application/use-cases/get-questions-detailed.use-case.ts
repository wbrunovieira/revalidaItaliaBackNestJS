// src/domain/assessment/application/use-cases/get-questions-detailed.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { GetQuestionsDetailedRequest } from '../dtos/get-questions-detailed-request.dto';
import { GetQuestionsDetailedResponse, QuestionDetailed, ArgumentDetailed } from '../dtos/get-questions-detailed-response.dto';
import { getQuestionsDetailedSchema } from './validations/get-questions-detailed.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';

type GetQuestionsDetailedUseCaseResponse = Either<
  | InvalidInputError
  | AssessmentNotFoundError
  | RepositoryError,
  GetQuestionsDetailedResponse
>;

@Injectable()
export class GetQuestionsDetailedUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private assessmentRepository: IAssessmentRepository,
    @Inject('QuestionRepository')
    private questionRepository: IQuestionRepository,
    @Inject('QuestionOptionRepository')
    private questionOptionRepository: IQuestionOptionRepository,
    @Inject('AnswerRepository')
    private answerRepository: IAnswerRepository,
    @Inject('ArgumentRepository')
    private argumentRepository: IArgumentRepository,
    @Inject('LessonRepository')
    private lessonRepository: ILessonRepository,
  ) {}

  async execute(request: GetQuestionsDetailedRequest): Promise<GetQuestionsDetailedUseCaseResponse> {
    // Validate input
    const validation = getQuestionsDetailedSchema.safeParse(request);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const { assessmentId } = validation.data;

    try {
      // Get assessment
      const assessmentResult = await this.assessmentRepository.findById(assessmentId);
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }
      const assessment = assessmentResult.value;

      // Get lesson if assessment has lessonId
      let lessonInfo: {
        id: string;
        slug: string;
        title: string;
        order: number;
        moduleId: string;
      } | undefined = undefined;
      
      if (assessment.lessonId) {
        const lessonResult = await this.lessonRepository.findById(assessment.lessonId.toString());
        if (lessonResult.isRight()) {
          const lessonEntity = lessonResult.value;
          const ptTranslation = lessonEntity.translations.find(t => t.locale === 'pt');
          lessonInfo = {
            id: lessonEntity.id.toString(),
            slug: lessonEntity.slug,
            title: ptTranslation?.title || lessonEntity.translations[0]?.title || '',
            order: lessonEntity.order,
            moduleId: lessonEntity.moduleId,
          };
        }
      }

      // Get all questions for the assessment
      const questionsResult = await this.questionRepository.findByAssessmentId(assessmentId);
      if (questionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch questions'));
      }
      const questions = questionsResult.value;

      // Get all question IDs
      const questionIds = questions.map(q => q.id.toString());

      // Get all options for all questions
      const optionsResult = await this.questionOptionRepository.findByQuestionIds(questionIds);
      if (optionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch question options'));
      }
      const allOptions = optionsResult.value;

      // Get all answers for all questions
      const answersResult = await this.answerRepository.findManyByQuestionIds(questionIds);
      if (answersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch answers'));
      }
      const allAnswers = answersResult.value;

      // Create map of answers by questionId
      const answersByQuestionId = new Map<string, typeof allAnswers[0]>();
      allAnswers.forEach(answer => {
        answersByQuestionId.set(answer.questionId.toString(), answer);
      });

      // Create map of options by questionId
      const optionsByQuestionId = new Map<string, typeof allOptions>();
      allOptions.forEach(option => {
        const questionId = option.questionId.toString();
        if (!optionsByQuestionId.has(questionId)) {
          optionsByQuestionId.set(questionId, []);
        }
        optionsByQuestionId.get(questionId)!.push(option);
      });

      // Get arguments if assessment type is SIMULADO
      let argumentsList: ArgumentDetailed[] = [];
      const argumentsMap = new Map<string, ArgumentDetailed>();
      
      if (assessment.type === 'SIMULADO') {
        const argumentsResult = await this.argumentRepository.findByAssessmentId(assessmentId);
        if (argumentsResult.isRight()) {
          const assessmentArguments = argumentsResult.value;
          
          assessmentArguments.forEach(arg => {
            if (arg.assessmentId) {
              const argDetailed: ArgumentDetailed = {
                id: arg.id.toString(),
                title: arg.title,
                description: undefined, // Argument entity doesn't have description
                assessmentId: arg.assessmentId.toString(),
                questions: [],
                createdAt: arg.createdAt,
                updatedAt: arg.updatedAt,
              };
              argumentsMap.set(arg.id.toString(), argDetailed);
              argumentsList.push(argDetailed);
            }
          });
        }
      }

      // Build detailed questions
      const questionsDetailed: QuestionDetailed[] = [];
      let totalQuestionsWithAnswers = 0;

      questions.forEach(question => {
        const questionId = question.id.toString();
        const answer = answersByQuestionId.get(questionId);
        const options = optionsByQuestionId.get(questionId) || [];

        if (answer) {
          totalQuestionsWithAnswers++;
        }

        const questionDetailed: QuestionDetailed = {
          id: questionId,
          text: question.text,
          type: question.type.getValue() as 'MULTIPLE_CHOICE' | 'OPEN',
          argumentId: question.argumentId?.toString(),
          options: options.map(opt => ({
            id: opt.id.toString(),
            text: opt.text,
            createdAt: opt.createdAt,
            updatedAt: opt.updatedAt,
          })),
          answer: answer ? {
            id: answer.id.toString(),
            correctOptionId: answer.correctOptionId?.toString(),
            explanation: answer.explanation,
            translations: answer.translations.map(t => ({
              locale: t.locale,
              explanation: t.explanation,
            })),
          } : undefined,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        };

        questionsDetailed.push(questionDetailed);

        // Add question to its argument if it has one
        if (question.argumentId && argumentsMap.has(question.argumentId.toString())) {
          argumentsMap.get(question.argumentId.toString())!.questions.push(questionDetailed);
        }
      });

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
        lesson: lessonInfo,
        arguments: argumentsList,
        questions: questionsDetailed,
        totalQuestions: questions.length,
        totalQuestionsWithAnswers,
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}