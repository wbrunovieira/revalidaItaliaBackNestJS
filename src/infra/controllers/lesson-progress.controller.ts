import {
  Controller,
  Post,
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
import { SaveLessonProgressDto } from '@/infra/http/dtos/save-lesson-progress.dto';
import { SaveLessonProgressRequest } from '@/domain/course-catalog/application/dtos/save-lesson-progress.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';

@ApiTags('User Progress')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonProgressController {
  constructor(private readonly saveLessonProgress: SaveLessonProgressUseCase) {}

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

      throw new InternalServerErrorException('Failed to save progress');
    }

    return result.value;
  }
}
