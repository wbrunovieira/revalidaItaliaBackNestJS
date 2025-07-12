// src/domain/assessment/application/use-cases/create-argument.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { CreateArgumentRequest } from '../dtos/create-argument-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateArgumentError } from './errors/duplicate-argument-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import {
  CreateArgumentSchema,
  createArgumentSchema,
} from './validations/create-argument.schema';

type CreateArgumentUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateArgumentError
  | RepositoryError
  | AssessmentNotFoundError
  | Error,
  {
    argument: {
      id: string;
      title: string;
      assessmentId?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class CreateArgumentUseCase {
  constructor(
    @Inject('ArgumentRepository')
    private readonly argumentRepository: IArgumentRepository,
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: CreateArgumentRequest,
  ): Promise<CreateArgumentUseCaseResponse> {
    const parseResult = createArgumentSchema.safeParse(request);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const data: CreateArgumentSchema = parseResult.data;

    // Verificar se já existe um argumento com esse título
    try {
      const existing = await this.argumentRepository.findByTitle(data.title);
      if (existing.isRight()) {
        return left(new DuplicateArgumentError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // Verificar se o assessmentId informado existe (se fornecido)
    if (data.assessmentId) {
      try {
        const assessment = await this.assessmentRepository.findById(
          data.assessmentId,
        );
        if (assessment.isLeft()) {
          return left(new AssessmentNotFoundError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    // Criar o argumento com ou sem assessmentId
    const argument = Argument.create({
      title: data.title,
      assessmentId: data.assessmentId
        ? new UniqueEntityID(data.assessmentId)
        : undefined,
    });

    try {
      const createdOrError = await this.argumentRepository.create(argument);
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const responsePayload = {
      argument: {
        id: argument.id.toString(),
        title: argument.title,
        assessmentId: argument.assessmentId?.toString(),
        createdAt: argument.createdAt,
        updatedAt: argument.updatedAt,
      },
    };

    return right(responsePayload);
  }
}
