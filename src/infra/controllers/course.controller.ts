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
} from '@nestjs/common';

import { CreateCourseUseCase } from '@/domain/course-catalog/application/use-cases/create-course.use-case';
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto';
import { GetCourseUseCase } from '@/domain/course-catalog/application/use-cases/get-course.use-case';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';

@Controller('courses')
export class CourseController {
  constructor(
    @Inject(CreateCourseUseCase)
    private readonly createCourseUseCase: CreateCourseUseCase,
    @Inject(ListCoursesUseCase)
    private readonly listCoursesUseCase: ListCoursesUseCase,
    @Inject(GetCourseUseCase)
    private readonly getCourseUseCase: GetCourseUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const request = {
      slug: dto.slug,

      translations: dto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

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
}
