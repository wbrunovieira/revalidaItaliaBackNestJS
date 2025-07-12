// src/domain/assessment/application/use-cases/get-assessment.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { GetAssessmentRequest } from '@/domain/assessment/application/dtos/get-assessment-request.dto';
import { GetAssessmentResponse } from '@/domain/assessment/application/dtos/get-assessment-response.dto';
import { getAssessmentSchema } from '@/domain/assessment/application/use-cases/validations/get-assessment.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

export type GetAssessmentUseCaseResponse = Either<
  InvalidInputError | AssessmentNotFoundError | RepositoryError,
  GetAssessmentResponse
>;

@Injectable()
export class GetAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: GetAssessmentRequest,
  ): Promise<GetAssessmentUseCaseResponse> {
    const parseResult = getAssessmentSchema.safeParse(request);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const { id } = parseResult.data;

    try {
      const result = await this.assessmentRepository.findById(id);

      if (result.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      const assessment = result.value;

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
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
