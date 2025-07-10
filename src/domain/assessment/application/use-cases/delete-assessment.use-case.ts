// src/domain/assessment/application/use-cases/delete-assessment.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { DeleteAssessmentRequest } from '@/domain/assessment/application/dtos/delete-assessment-request.dto';
import { DeleteAssessmentResponse } from '@/domain/assessment/application/dtos/delete-assessment-response.dto';
import { deleteAssessmentSchema } from '@/domain/assessment/application/use-cases/validations/delete-assessment.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

export type DeleteAssessmentUseCaseResponse = Either<
  InvalidInputError | AssessmentNotFoundError | RepositoryError,
  DeleteAssessmentResponse
>;

@Injectable()
export class DeleteAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: DeleteAssessmentRequest,
  ): Promise<DeleteAssessmentUseCaseResponse> {
    const parseResult = deleteAssessmentSchema.safeParse(request);
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

      await this.assessmentRepository.delete(id);

      return right({});
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
