import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { ListArgumentsRequest } from '../dtos/list-arguments-request.dto';
import {
  ListArgumentsResponse,
  ArgumentDto,
} from '../dtos/list-arguments-response.dto';
import {
  ListArgumentsSchema,
  listArgumentsSchema,
} from './validations/list-arguments.schema';

export type ListArgumentsUseCaseResponse = Either<
  InvalidInputError | AssessmentNotFoundError | RepositoryError,
  ListArgumentsResponse
>;

@Injectable()
export class ListArgumentsUseCase {
  constructor(
    @Inject('ArgumentRepository')
    private readonly argumentRepo: IArgumentRepository,
    @Inject('AssessmentRepository')
    private readonly assessmentRepo: IAssessmentRepository,
  ) {}

  async execute(
    request: ListArgumentsRequest,
  ): Promise<ListArgumentsUseCaseResponse> {
    // 1) Validate input
    const parsed = listArgumentsSchema.safeParse(request);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }
    const data: ListArgumentsSchema = parsed.data;

    // 2) If assessmentId is provided, validate assessment exists
    if (data.assessmentId) {
      const foundAssessment = await this.assessmentRepo.findById(
        data.assessmentId,
      );
      if (foundAssessment.isLeft()) {
        return left(new AssessmentNotFoundError());
      }
    }

    // 3) Get arguments with pagination
    const offset = (data.page - 1) * data.limit;

    let argumentsResult;

    if (data.assessmentId) {
      // Get arguments filtered by assessmentId
      const assessmentArgumentsResult =
        await this.argumentRepo.findByAssessmentId(data.assessmentId);
      if (assessmentArgumentsResult.isLeft()) {
        return left(
          new RepositoryError(assessmentArgumentsResult.value.message),
        );
      }

      let filteredArguments = assessmentArgumentsResult.value;

      // Sort by creation date descending
      filteredArguments.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      // Apply pagination manually
      const total = filteredArguments.length;
      const items = filteredArguments.slice(offset, offset + data.limit);

      argumentsResult = { items, total };
    } else {
      // Get all arguments with pagination
      const allArgumentsResult = await this.argumentRepo.findAllPaginated(
        data.limit,
        offset,
      );

      if (allArgumentsResult.isLeft()) {
        return left(new RepositoryError(allArgumentsResult.value.message));
      }

      // Renomeando para evitar conflito com a palavra reservada
      const { arguments: items, total } = allArgumentsResult.value;
      argumentsResult = { items, total };
    }

    const { items, total } = argumentsResult;

    // 4) Build response with pagination
    const totalPages = Math.ceil(total / data.limit);
    const hasNext = data.page < totalPages;
    const hasPrevious = data.page > 1;

    const response: ListArgumentsResponse = {
      arguments: items.map(
        (argument): ArgumentDto => ({
          id: argument.id.toString(),
          title: argument.title,
          assessmentId: argument.assessmentId?.toString(),
          createdAt: argument.createdAt,
          updatedAt: argument.updatedAt,
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
