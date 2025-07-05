// src/infra/course-catalog/controllers/course.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Param,
  NotFoundException,
  Delete,
  Put,
} from '@nestjs/common';

import { CreateCourseUseCase } from '@/domain/course-catalog/application/use-cases/create-course.use-case';
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto';
import { GetCourseUseCase } from '@/domain/course-catalog/application/use-cases/get-course.use-case';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { CourseHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/course-has-dependencies-error';
import { DeleteCourseUseCase } from '@/domain/course-catalog/application/use-cases/delete-course.use-case';
import { UpdateCourseUseCase } from '@/domain/course-catalog/application/use-cases/update-course.use-case';
import { CourseNotModifiedError } from '@/domain/course-catalog/application/use-cases/errors/course-not-modified-error';
import { UpdateCourseDto } from '@/domain/course-catalog/application/dtos/update-course.dto';

@Controller('courses')
export class CourseController {
  constructor(
    @Inject(CreateCourseUseCase)
    private readonly createCourseUseCase: CreateCourseUseCase,
    @Inject(ListCoursesUseCase)
    private readonly listCoursesUseCase: ListCoursesUseCase,
    @Inject(GetCourseUseCase)
    private readonly getCourseUseCase: GetCourseUseCase,
    @Inject(DeleteCourseUseCase)
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
    @Inject(UpdateCourseUseCase)
    private readonly updateCourseUseCase: UpdateCourseUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const request = {
      slug: dto.slug,
      imageUrl: dto.imageUrl,

      translations: dto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };
    console.log('chegou no create course', request);

    const result = await this.createCourseUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof DuplicateCourseError) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    const { course } = result.value as any;
    return course;
  }

  @Get()
  async list() {
    const result = await this.listCoursesUseCase.execute();
    if (result.isLeft()) {
      throw new InternalServerErrorException(result.value.message);
    }
    return (result.value as any).courses;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.getCourseUseCase.execute({ id });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }
      if (err instanceof CourseNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err.message);
    }
    return (result.value as any).course;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.deleteCourseUseCase.execute({ id });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid course ID format',
          details: error.details,
        });
      }

      if (error instanceof CourseNotFoundError) {
        throw new NotFoundException({
          error: 'COURSE_NOT_FOUND',
          message: error.message,
        });
      }

      if (error instanceof CourseHasDependenciesError) {
        // Resposta especial para dependências com informações para o frontend
        const errorWithInfo = error as any;
        throw new BadRequestException({
          error: 'COURSE_HAS_DEPENDENCIES',
          message: error.message,
          canDelete: false,
          dependencies: errorWithInfo.dependencyInfo?.dependencies || [],
          summary: errorWithInfo.dependencyInfo?.summary || {},
          totalDependencies:
            errorWithInfo.dependencyInfo?.totalDependencies || 0,
          actionRequired:
            'Please resolve the dependencies before deleting this course',
        });
      }

      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: error.message,
      });
    }

    // Sucesso
    return {
      success: true,
      message: result.value.message,
      deletedAt: result.value.deletedAt,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const request = {
      id,
      slug: dto.slug,
      imageUrl: dto.imageUrl,
      translations: dto.translations?.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

    const result = await this.updateCourseUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof CourseNotFoundError) {
        throw new NotFoundException({
          error: 'COURSE_NOT_FOUND',
          message: error.message,
        });
      }

      if (error instanceof DuplicateCourseError) {
        throw new ConflictException({
          error: 'DUPLICATE_COURSE',
          message: error.message,
        });
      }

      if (error instanceof CourseNotModifiedError) {
        throw new BadRequestException({
          error: 'COURSE_NOT_MODIFIED',
          message: error.message,
        });
      }

      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: error.message,
      });
    }

    // Sucesso
    return {
      success: true,
      course: result.value.course,
    };
  }
}
