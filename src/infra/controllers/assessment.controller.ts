// src/infra/course-catalog/controllers/assessment.controller.ts
import { CreateAssessmentDto } from '@/domain/assessment/application/dtos/create-assessment.dto';
import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { DuplicateAssessmentError } from '@/domain/assessment/application/use-cases/errors/duplicate-assessment-error';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Controller('assessments')
export class AssessmentController {
  constructor(
    @Inject(CreateAssessmentUseCase)
    private readonly createAssessmentUseCase: CreateAssessmentUseCase,
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

      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: error.message,
      });
    }

    const { assessment } = result.value as any;
    return {
      success: true,
      assessment,
    };
  }
}
