// src/domain/assessment/application/use-cases/create-answer.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { AnswerTranslationVO } from '@/domain/assessment/enterprise/value-objects/answer-translation.vo';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { CreateAnswerRequest } from '../dtos/create-answer-request.dto';
import { CreateAnswerResponse } from '../dtos/create-answer-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { AnswerAlreadyExistsError } from './errors/answer-already-exists-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { InvalidAnswerTypeError } from './errors/invalid-answer-type-error';
import {
  CreateAnswerSchema,
  createAnswerSchema,
} from './validations/create-answer.schema';

type CreateAnswerUseCaseResponse = Either<
  | InvalidInputError
  | AnswerAlreadyExistsError
  | QuestionNotFoundError
  | AssessmentNotFoundError
  | InvalidAnswerTypeError
  | RepositoryError
  | Error,
  CreateAnswerResponse
>;

@Injectable()
export class CreateAnswerUseCase {
  constructor(
    @Inject('AnswerRepository')
    private readonly answerRepository: IAnswerRepository,
    @Inject('QuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: CreateAnswerRequest,
  ): Promise<CreateAnswerUseCaseResponse> {
    // 1. Validate input data
    const validationResult = createAnswerSchema.safeParse(request);
    if (!validationResult.success) {
      return left(new InvalidInputError(validationResult.error.message));
    }

    const validatedData: CreateAnswerSchema = validationResult.data;

    // 2. Check if question exists
    const questionResult = await this.questionRepository.findById(
      validatedData.questionId,
    );
    if (questionResult.isLeft()) {
      const error = questionResult.value;
      if (error.message === 'Question not found') {
        return left(new QuestionNotFoundError());
      }
      return left(new RepositoryError('Failed to fetch question'));
    }

    const question = questionResult.value;

    // 3. Check if assessment exists
    const assessmentResult = await this.assessmentRepository.findById(
      question.assessmentId.toString(),
    );
    if (assessmentResult.isLeft()) {
      const error = assessmentResult.value;
      if (error.message === 'Assessment not found') {
        return left(new AssessmentNotFoundError());
      }
      return left(new RepositoryError('Failed to fetch assessment'));
    }

    const assessment = assessmentResult.value;

    // 4. Check if answer already exists for this question
    // Note: Temporarily allowing multiple answers for testing purposes
    // TODO: Implement proper answer update logic or separate update use case
    const existingAnswerResult = await this.answerRepository.existsByQuestionId(
      validatedData.questionId,
    );
    if (existingAnswerResult.isLeft()) {
      return left(new RepositoryError('Failed to check existing answer'));
    }

    // Check for duplicate answers
    if (existingAnswerResult.value) {
      return left(new AnswerAlreadyExistsError());
    }

    // 5. Validate answer type based on assessment and question type
    const validationError = this.validateAnswerType(
      assessment.type,
      question.type.getValue(),
      validatedData.correctOptionId,
    );
    if (validationError) {
      return left(validationError);
    }

    // 6. Create translations if provided
    const translations: AnswerTranslationVO[] = [];
    if (validatedData.translations) {
      for (const translation of validatedData.translations) {
        translations.push(
          new AnswerTranslationVO(translation.locale, translation.explanation),
        );
      }
    }

    // 7. Create Answer entity
    const answer = Answer.create({
      correctOptionId: validatedData.correctOptionId
        ? new UniqueEntityID(validatedData.correctOptionId)
        : undefined,
      explanation: validatedData.explanation,
      questionId: new UniqueEntityID(validatedData.questionId),
      translations,
    });

    // 8. Save answer to repository
    const createResult = await this.answerRepository.create(answer);
    if (createResult.isLeft()) {
      return left(new RepositoryError('Failed to create answer'));
    }

    // 9. Return response
    const response: CreateAnswerResponse = {
      answer: {
        id: answer.id.toString(),
        correctOptionId: answer.correctOptionId?.toString(),
        explanation: answer.explanation,
        questionId: answer.questionId.toString(),
        translations: answer.translations.map((translation) => ({
          locale: translation.locale,
          explanation: translation.explanation,
        })),
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
      },
    };

    return right(response);
  }

  private validateAnswerType(
    assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    questionType: 'MULTIPLE_CHOICE' | 'OPEN',
    correctOptionId?: string,
  ): InvalidAnswerTypeError | null {
    // Business rules validation
    switch (assessmentType) {
      case 'QUIZ':
        if (questionType !== 'MULTIPLE_CHOICE') {
          return new InvalidAnswerTypeError(
            'QUIZ assessments can only have MULTIPLE_CHOICE questions',
          );
        }
        if (!correctOptionId) {
          return new InvalidAnswerTypeError(
            'MULTIPLE_CHOICE questions in QUIZ assessments must have a correct option ID',
          );
        }
        break;

      case 'SIMULADO':
        if (questionType !== 'MULTIPLE_CHOICE') {
          return new InvalidAnswerTypeError(
            'SIMULADO assessments can only have MULTIPLE_CHOICE questions',
          );
        }
        if (!correctOptionId) {
          return new InvalidAnswerTypeError(
            'MULTIPLE_CHOICE questions in SIMULADO assessments must have a correct option ID',
          );
        }
        break;

      case 'PROVA_ABERTA':
        if (questionType !== 'OPEN') {
          return new InvalidAnswerTypeError(
            'PROVA_ABERTA assessments can only have OPEN questions',
          );
        }
        // For OPEN questions, correctOptionId is optional
        break;

      default:
        return new InvalidAnswerTypeError('Unknown assessment type');
    }

    return null;
  }
}
