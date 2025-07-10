// src/domain/assessment/application/use-cases/list-assessments.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { ListAssessmentsRequest } from '../dtos/list-assessments-request.dto';
import {
  ListAssessmentsResponse,
  AssessmentDto,
} from '../dtos/list-assessments-response.dto';
import {
  ListAssessmentsSchema,
  listAssessmentsSchema,
} from './validations/list-assessments.schema';

export type ListAssessmentsUseCaseResponse = Either<
  InvalidInputError | LessonNotFoundError | RepositoryError,
  ListAssessmentsResponse
>;

@Injectable()
export class ListAssessmentsUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepo: IAssessmentRepository,
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(
    request: ListAssessmentsRequest,
  ): Promise<ListAssessmentsUseCaseResponse> {
    // 1) Validate input
    const parsed = listAssessmentsSchema.safeParse(request);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }
    const data: ListAssessmentsSchema = parsed.data;

    // 2) If lessonId is provided, validate lesson exists
    if (data.lessonId) {
      const foundLesson = await this.lessonRepo.findById(data.lessonId);
      if (foundLesson.isLeft()) {
        return left(new LessonNotFoundError());
      }
    }

    // 3) Get assessments with pagination
    const offset = (data.page - 1) * data.limit;

    let assessmentsResult;

    if (data.lessonId) {
      // Get assessments filtered by lessonId
      const lessonAssessmentsResult = await this.assessmentRepo.findByLessonId(
        data.lessonId,
      );
      if (lessonAssessmentsResult.isLeft()) {
        return left(new RepositoryError(lessonAssessmentsResult.value.message));
      }

      let filteredAssessments = lessonAssessmentsResult.value;

      // Apply type filter if provided
      if (data.type) {
        filteredAssessments = filteredAssessments.filter(
          (assessment) => assessment.type === data.type,
        );
      }

      // Sort by creation date descending
      filteredAssessments.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      // Apply pagination manually
      const total = filteredAssessments.length;
      const assessments = filteredAssessments.slice(
        offset,
        offset + data.limit,
      );

      assessmentsResult = { assessments, total };
    } else {
      // Get all assessments with pagination
      const allAssessmentsResult = await this.assessmentRepo.findAllPaginated(
        data.limit,
        offset,
      );

      if (allAssessmentsResult.isLeft()) {
        return left(new RepositoryError(allAssessmentsResult.value.message));
      }

      let { assessments, total } = allAssessmentsResult.value;

      // Apply type filter if provided
      if (data.type) {
        assessments = assessments.filter(
          (assessment) => assessment.type === data.type,
        );
        // Recalculate total for filtered results
        // Note: This is not optimal for large datasets, but works for this use case
        const allFilteredResult = await this.assessmentRepo.findAll();
        if (allFilteredResult.isLeft()) {
          return left(new RepositoryError(allFilteredResult.value.message));
        }
        total = allFilteredResult.value.filter(
          (assessment) => assessment.type === data.type,
        ).length;
      }

      assessmentsResult = { assessments, total };
    }

    const { assessments, total } = assessmentsResult;

    // 4) Build response with pagination
    const totalPages = Math.ceil(total / data.limit);
    const hasNext = data.page < totalPages;
    const hasPrevious = data.page > 1;

    const response: ListAssessmentsResponse = {
      assessments: assessments.map(
        (assessment): AssessmentDto => ({
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
        }),
      ),
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };

    return right(response);
  }
}
