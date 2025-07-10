// src/domain/assessment/application/use-cases/create-assessment.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { textToSlug } from '@/core/utils/text-to-slug';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import {
  CreateAssessmentSchema,
  createAssessmentSchema,
} from './validations/create-assessment.schema';

type CreateAssessmentUseCaseResponse = Either<
  InvalidInputError | DuplicateAssessmentError | RepositoryError | Error,
  {
    assessment: {
      id: string;
      slug: string;
      title: string;
      description?: string;
      type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
      quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
      passingScore: number;
      timeLimitInMinutes?: number;
      randomizeQuestions: boolean;
      randomizeOptions: boolean;
      lessonId?: string;
    };
  }
>;

@Injectable()
export class CreateAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(
    request: CreateAssessmentRequest,
  ): Promise<CreateAssessmentUseCaseResponse> {
    const parseResult = createAssessmentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === 'invalid_type') {
          detail.expected = 'string|number';
          detail.received = (issue as any).received;
        } else if ('expected' in issue) {
          detail.expected = (issue as any).expected;
        }
        if ('received' in issue && issue.code !== 'invalid_type') {
          detail.received = (issue as any).received;
        }
        if ('minimum' in issue) detail.minimum = (issue as any).minimum;
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: CreateAssessmentSchema = parseResult.data;

    try {
      const existing = await this.assessmentRepository.findByTitle(data.title);
      if (existing.isRight()) {
        return left(new DuplicateAssessmentError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    let slug: string;
    try {
      slug = textToSlug(data.title);
      if (slug.length < 3) {
        throw new Error('Title must be at least 3 characters long to generate a valid slug');
      }
    } catch (err: any) {
      const details = [{ message: err.message, path: ['title'] }];
      return left(new InvalidInputError('Invalid title for slug generation', details));
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
      },
    };

    return right(responsePayload);
  }
}