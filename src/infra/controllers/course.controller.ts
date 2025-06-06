// src/infra/course-catalog/controllers/course.controller.ts
import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { CreateCourseUseCase } from '@/domain/course-catalog/application/use-cases/create-course.use-case';
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto';


@Controller('courses')
export class CourseController {
  constructor(
    @Inject(CreateCourseUseCase)
    private readonly createCourseUseCase: CreateCourseUseCase
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
}