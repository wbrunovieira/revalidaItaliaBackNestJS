import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';
import { SaveLessonProgressUseCase } from '@/domain/course-catalog/application/use-cases/save-lesson-progress.use-case';
import { GetContinueLearningUseCase } from '@/domain/course-catalog/application/use-cases/get-continue-learning.use-case';
import { SaveLessonProgressDto } from '@/infra/http/dtos/save-lesson-progress.dto';
import { SaveLessonProgressRequest } from '@/domain/course-catalog/application/dtos/save-lesson-progress.dto';
import { GetContinueLearningResponse } from '@/domain/course-catalog/application/dtos/get-continue-learning.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

@ApiTags('User Progress')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonProgressController {
  constructor(
    private readonly saveLessonProgress: SaveLessonProgressUseCase,
    private readonly getContinueLearning: GetContinueLearningUseCase,
  ) {}

  @Post('lesson-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save lesson progress',
    description:
      'Save the current progress of a lesson for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress saved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        progressSaved: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async saveProgress(
    @Body() dto: SaveLessonProgressDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ success: boolean; progressSaved: boolean }> {
    const request: SaveLessonProgressRequest = {
      userId: user.sub,
      lessonId: dto.lessonId,
      lessonTitle: dto.lessonTitle,
      courseId: dto.courseId,
      courseTitle: dto.courseTitle,
      courseSlug: dto.courseSlug,
      moduleId: dto.moduleId,
      moduleTitle: dto.moduleTitle,
      moduleSlug: dto.moduleSlug,
      lessonImageUrl: dto.lessonImageUrl,
      videoProgress: dto.videoProgress,
    };

    const result = await this.saveLessonProgress.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          message: error.message,
          errors: error.details,
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          message: 'Failed to save progress',
          details: error.message,
        });
      }

      throw new InternalServerErrorException('Failed to save progress');
    }

    return result.value;
  }

  @Get('continue-learning')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get continue learning data',
    description:
      'Get the last accessed lesson progress for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Continue learning data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hasProgress: { type: 'boolean', example: true },
        lastAccessed: {
          type: 'object',
          properties: {
            lessonId: {
              type: 'string',
              example: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
            },
            lessonTitle: { type: 'string', example: 'Introdução à Anatomia' },
            courseTitle: { type: 'string', example: 'Revalida Medicina' },
            moduleTitle: { type: 'string', example: 'Anatomia Básica' },
            lessonImageUrl: {
              type: 'string',
              example: '/images/lesson-anatomy.jpg',
            },
            videoProgress: {
              type: 'object',
              properties: {
                currentTime: { type: 'number', example: 245.7 },
                duration: { type: 'number', example: 600 },
                percentage: { type: 'number', example: 40.95 },
              },
            },
            lessonUrl: {
              type: 'string',
              example:
                '/pt/courses/curso-teste-pt/modules/modulo-1/lessons/d50f6fb6-c282-402e-b8e1-00fd902dc0da',
            },
            lastUpdatedAt: { type: 'string', example: '2025-01-23T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getContinueLearningData(
    @CurrentUser() user: UserPayload,
  ): Promise<GetContinueLearningResponse> {
    const result = await this.getContinueLearning.execute({
      userId: user.sub,
    });

    if (result.isLeft()) {
      // This use case doesn't return errors, but keeping for consistency
      throw new InternalServerErrorException('Failed to retrieve progress');
    }

    return result.value;
  }
}
