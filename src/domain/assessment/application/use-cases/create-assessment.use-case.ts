// src/domain/assessment/application/use-cases/create-assessment.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { textToSlug } from '@/core/utils/text-to-slug';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import {
  CreateAssessmentSchema,
  createAssessmentSchema,
} from './validations/create-assessment.schema';

type CreateAssessmentUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateAssessmentError
  | RepositoryError
  | LessonNotFoundError
  | Error,
  {
    assessment: {
      id: string;
      slug: string;
      title: string;
      description?: string;
      type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
      quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
      passingScore?: number;
      timeLimitInMinutes?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      lessonId?: string;
    };
  }
>;

@Injectable()
export class CreateAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(
    request: CreateAssessmentRequest,
  ): Promise<CreateAssessmentUseCaseResponse> {
    const parseResult = createAssessmentSchema.safeParse(request);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const data: CreateAssessmentSchema = parseResult.data;

    // Verificar se já existe um assessment com esse título
    try {
      const existing = await this.assessmentRepository.findByTitle(data.title);
      if (existing.isRight()) {
        return left(new DuplicateAssessmentError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // Verificar se a lessonId informada existe (independente do tipo)
    if (data.lessonId) {
      try {
        const lesson = await this.lessonRepository.findById(data.lessonId);
        if (lesson.isLeft()) {
          return left(new LessonNotFoundError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    // Gerar slug a partir do título
    let slug: string;
    try {
      slug = textToSlug(data.title);
      if (slug.length < 3) {
        throw new Error(
          'Title must be at least 3 characters long to generate a valid slug',
        );
      }
    } catch (err: any) {
      return left(
        new InvalidInputError('Invalid title for slug generation', [
          `Invalid slug: ${err.message}`,
        ]),
      );
    }

    const assessment = Assessment.create({
      slug,
      title: data.title,
      description: data.description,
      type: data.type,
      quizPosition: data.quizPosition,
      passingScore: data.passingScore,
      timeLimitInMinutes: data.timeLimitInMinutes,
      randomizeQuestions: data.randomizeQuestions,
      randomizeOptions: data.randomizeOptions,
      lessonId: data.lessonId ? new UniqueEntityID(data.lessonId) : undefined,
    });

    try {
      const createdOrError = await this.assessmentRepository.create(assessment);
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const responsePayload = {
      assessment: assessment.toResponseObject(),
    };

    return right(responsePayload);
  }
}
