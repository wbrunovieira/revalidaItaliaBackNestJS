// src/domain/assessment/application/use-cases/update-assessment.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { UpdateAssessmentRequest } from '@/domain/assessment/application/dtos/update-assessment-request.dto';
import { UpdateAssessmentResponse } from '@/domain/assessment/application/dtos/update-assessment-response.dto';
import { updateAssessmentSchema } from '@/domain/assessment/application/use-cases/validations/update-assessment.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { textToSlug } from '@/core/utils/text-to-slug';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AssessmentProps } from '../../enterprise/entities/assessment.entity';

export type UpdateAssessmentUseCaseResponse = Either<
  | InvalidInputError
  | AssessmentNotFoundError
  | RepositoryError
  | DuplicateAssessmentError,
  UpdateAssessmentResponse
>;

@Injectable()
export class UpdateAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: UpdateAssessmentRequest,
  ): Promise<UpdateAssessmentUseCaseResponse> {
    try {
      const parseResult = updateAssessmentSchema.safeParse(request);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        });
        return left(new InvalidInputError('Validation failed', errorMessages));
      }

      const { id, ...data } = parseResult.data;

      const existingAssessmentResult =
        await this.assessmentRepository.findById(id);

      if (existingAssessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      const assessment = existingAssessmentResult.value;

      // Validate type-specific fields
      const targetType = data.type !== undefined ? data.type : assessment.type;

      if (data.quizPosition !== undefined && targetType !== 'QUIZ') {
        return left(
          new InvalidInputError('Validation failed', [
            'quizPosition: Quiz position can only be set for QUIZ type assessments',
          ]),
        );
      }

      if (data.timeLimitInMinutes !== undefined && targetType !== 'SIMULADO') {
        return left(
          new InvalidInputError('Validation failed', [
            'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
          ]),
        );
      }

      const updateProps: Partial<AssessmentProps> = {};

      if (data.title) {
        const newTitle = data.title.trim();
        const newSlug = textToSlug(newTitle);

        const existingBySlug =
          await this.assessmentRepository.findByTitleExcludingId(newTitle, id);

        if (existingBySlug.isRight() && existingBySlug.value) {
          return left(new DuplicateAssessmentError());
        }

        updateProps.slug = newSlug;
        updateProps.title = newTitle;
      }

      if (data.description !== undefined) {
        updateProps.description = data.description;
      }

      if (data.type !== undefined) {
        updateProps.type = data.type;
      }

      if (data.quizPosition !== undefined) {
        updateProps.quizPosition = data.quizPosition;
      }

      if (data.passingScore !== undefined) {
        updateProps.passingScore = data.passingScore;
      }

      if (data.timeLimitInMinutes !== undefined) {
        updateProps.timeLimitInMinutes = data.timeLimitInMinutes;
      }

      if (data.randomizeQuestions !== undefined) {
        updateProps.randomizeQuestions = data.randomizeQuestions;
      }

      if (data.randomizeOptions !== undefined) {
        updateProps.randomizeOptions = data.randomizeOptions;
      }

      if (data.lessonId !== undefined) {
        if (data.lessonId === null) {
          updateProps.lessonId = null as any; // Preserve null as null
        } else {
          updateProps.lessonId = new UniqueEntityID(data.lessonId);
        }
      }

      assessment.update(updateProps);

      await this.assessmentRepository.update(assessment);

      return right({ assessment });
    } catch (err: any) {
      // Check if it's a validation error from our code
      if (err instanceof InvalidInputError) {
        return left(err);
      }
      // Check if it's a specific error we should handle differently
      if (err instanceof Error) {
        return left(new RepositoryError(err.message));
      }
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
