// src/domain/assessment/application/use-cases/create-question.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { CreateQuestionRequest } from '../dtos/create-question-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateQuestionError } from './errors/duplicate-question-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { QuestionTypeMismatchError } from './errors/question-type-mismatch-error';
import {
  CreateQuestionSchema,
  createQuestionSchema,
} from './validations/create-question.schema';

type CreateQuestionUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateQuestionError
  | RepositoryError
  | AssessmentNotFoundError
  | ArgumentNotFoundError
  | QuestionTypeMismatchError
  | Error,
  {
    question: {
      id: string;
      text: string;
      type: 'MULTIPLE_CHOICE' | 'OPEN';
      assessmentId: string;
      argumentId?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    @Inject('QuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
    @Inject('ArgumentRepository')
    private readonly argumentRepository: IArgumentRepository,
  ) {}

  async execute(
    request: CreateQuestionRequest,
  ): Promise<CreateQuestionUseCaseResponse> {
    const parseResult = createQuestionSchema.safeParse(request);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const data: CreateQuestionSchema = parseResult.data;

    // Verificar se o assessment existe
    let assessment;
    try {
      const assessmentResult = await this.assessmentRepository.findById(
        data.assessmentId,
      );
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }
      assessment = assessmentResult.value;
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // Verificar se o argument existe (se fornecido)
    if (data.argumentId) {
      try {
        const argumentResult = await this.argumentRepository.findById(
          data.argumentId,
        );
        if (argumentResult.isLeft()) {
          return left(new ArgumentNotFoundError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    // Verificar compatibilidade entre tipo de assessment e tipo de questão
    const recommendedType = this.getRecommendedQuestionType(assessment.type);
    if (data.type !== recommendedType) {
      return left(
        new QuestionTypeMismatchError(assessment.type, recommendedType),
      );
    }

    // Verificar se já existe uma questão similar no assessment
    try {
      const existingQuestions =
        await this.questionRepository.findByAssessmentId(data.assessmentId);
      if (existingQuestions.isRight()) {
        const hasSimilarText = existingQuestions.value.some(
          (q) => q.text.toLowerCase().trim() === data.text.toLowerCase().trim(),
        );
        if (hasSimilarText) {
          return left(new DuplicateQuestionError());
        }
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // Criar a questão
    let question: Question;
    try {
      question = Question.create({
        text: data.text,
        type: new QuestionTypeVO(data.type),
        assessmentId: new UniqueEntityID(data.assessmentId),
        argumentId: data.argumentId
          ? new UniqueEntityID(data.argumentId)
          : undefined,
      });
    } catch (err: any) {
      return left(
        new InvalidInputError('Question creation failed', [err.message]),
      );
    }

    try {
      const createdOrError = await this.questionRepository.create(question);
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const responsePayload = {
      question: {
        id: question.id.toString(),
        text: question.text,
        type: question.type.getValue(),
        assessmentId: question.assessmentId.toString(),
        argumentId: question.argumentId?.toString(),
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    };

    return right(responsePayload);
  }

  private getRecommendedQuestionType(
    assessmentType: string,
  ): 'MULTIPLE_CHOICE' | 'OPEN' {
    switch (assessmentType) {
      case 'QUIZ':
      case 'SIMULADO':
        return 'MULTIPLE_CHOICE';
      case 'PROVA_ABERTA':
        return 'OPEN';
      default:
        return 'MULTIPLE_CHOICE';
    }
  }
}
