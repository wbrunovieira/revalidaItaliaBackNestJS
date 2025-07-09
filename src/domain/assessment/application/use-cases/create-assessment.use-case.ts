// src/domain/assessment/application/use-cases/create-assessment.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { CreateAssessmentDto } from '../dtos/create-assessment.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import {
  CreateAssessmentSchema,
  createAssessmentSchema,
} from './validations/create-assessment.schema';
import { textToSlug } from '@/core/utils/text-to-slug';
import { UniqueEntityID } from '@/core/unique-entity-id';

type CreateAssessmentUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateAssessmentError
  | LessonNotFoundError
  | RepositoryError
  | Error,
  CreateAssessmentDto
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
    // Validate input
    const parseResult = createAssessmentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        let errorMessage = `${path}${issue.message}`;
        if (issue.code === 'invalid_type') {
          errorMessage = `${path}Expected ${(issue as any).expected} but received ${(issue as any).received}`;
        } else if (issue.code === 'too_small') {
          errorMessage = `${path}${issue.message} (minimum: ${(issue as any).minimum})`;
        } else if (issue.code === 'too_big') {
          errorMessage = `${path}${issue.message} (maximum: ${(issue as any).maximum})`;
        }
        return errorMessage;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: CreateAssessmentSchema = parseResult.data;

    // Check if lesson exists
    if (data.lessonId) {
      const lessonResult = await this.lessonRepository.findById(data.lessonId);
      if (lessonResult.isLeft()) {
        const error = lessonResult.value;
        if (error instanceof LessonNotFoundError) {
          return left(error);
        }
        return left(new RepositoryError(error.message));
      }
    }

    // Check for duplicate assessment by title
    const existingResult = await this.assessmentRepository.findByTitle(data.title);
    if (existingResult.isRight()) {
      return left(new DuplicateAssessmentError());
    }

    if (existingResult.isLeft()) {
      const error = existingResult.value;
      if (error.message !== 'Assessment not found') {
        return left(new RepositoryError(error.message));
      }
    }

    // Create assessment entity
    try {
      const assessment = Assessment.create({
        slug: textToSlug(data.title),
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

      // Save assessment
      const createdResult = await this.assessmentRepository.create(assessment);
      if (createdResult.isLeft()) {
        return left(new RepositoryError(createdResult.value.message));
      }

      // Build response
      const responsePayload: CreateAssessmentDto = {
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
      };

      return right(responsePayload);
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}