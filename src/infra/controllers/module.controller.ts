// src/infra/course-catalog/controllers/module.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';

import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { CreateModuleDto } from '@/domain/course-catalog/application/dtos/create-module.dto';

@Controller('courses/:courseId/modules')
export class ModuleController {
  constructor(
    @Inject(CreateModuleUseCase)
    private readonly createModuleUseCase: CreateModuleUseCase
  ) {}

  @Post()
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto
  ) {
    const request = {
      courseId,
      slug: dto.slug,
      translations: dto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
      order: dto.order,
    };

    const result = await this.createModuleUseCase.execute(request);
    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof CourseNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DuplicateModuleOrderError) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    const { module } = result.value as any;
    return module;
  }
}