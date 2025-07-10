// src/infra/course-catalog/controllers/assessment.controller.ts
import { CreateAssessmentDto } from '@/domain/assessment/application/dtos/create-assessment.dto';
import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from '@/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '@/domain/assessment/application/use-cases/get-assessment.use-case';
import { DuplicateAssessmentError } from '@/domain/assessment/application/use-cases/errors/duplicate-assessment-error';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/assessment/application/use-cases/errors/lesson-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@Controller('assessments')
export class AssessmentController {
  constructor(
    @Inject(CreateAssessmentUseCase)
    private readonly createAssessmentUseCase: CreateAssessmentUseCase,
    @Inject(ListAssessmentsUseCase)
    private readonly listAssessmentsUseCase: ListAssessmentsUseCase,
    @Inject(GetAssessmentUseCase)
    private readonly getAssessmentUseCase: GetAssessmentUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateAssessmentDto) {
    const request = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      quizPosition: dto.quizPosition,
      passingScore: dto.passingScore,
      timeLimitInMinutes: dto.timeLimitInMinutes,
      randomizeQuestions: dto.randomizeQuestions,
      randomizeOptions: dto.randomizeOptions,
      lessonId: dto.lessonId,
    };

    const result = await this.createAssessmentUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof DuplicateAssessmentError) {
        throw new ConflictException({
          error: 'DUPLICATE_ASSESSMENT',
          message: error.message,
        });
      }

      if (error instanceof LessonNotFoundError) {
        throw new InternalServerErrorException({
          error: 'INTERNAL_ERROR',
          message: 'Lesson not found',
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          error: 'INTERNAL_ERROR',
          message: error.message,
        });
      }

      // Fallback para erros não mapeados
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
      });
    }

    const { assessment } = result.value as any;
    return {
      success: true,
      assessment,
    };
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    @Query('lessonId') lessonId?: string,
  ) {
    const request = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      lessonId,
    };

    const result = await this.listAssessmentsUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof LessonNotFoundError) {
        throw new NotFoundException({
          error: 'LESSON_NOT_FOUND',
          message: 'Lesson not found',
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          error: 'REPOSITORY_ERROR',
          message: error.message,
        });
      }

      // Fallback para erros não mapeados
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }

    return result.value;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.getAssessmentUseCase.execute({ id });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          error: 'REPOSITORY_ERROR',
          message: error.message,
        });
      }

      // Fallback para erros não mapeados
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
    }

    return result.value;
  }
}
