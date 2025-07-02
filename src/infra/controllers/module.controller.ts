// src/infra/course-catalog/controllers/module.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Delete,
} from '@nestjs/common';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';
import { GetModulesUseCase } from '@/domain/course-catalog/application/use-cases/get-modules.use-case';

import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { CreateModuleDto } from '@/domain/course-catalog/application/dtos/create-module.dto';
import { GetModuleUseCase } from '@/domain/course-catalog/application/use-cases/get-module.use-case';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { DeleteModuleUseCase } from '@/domain/course-catalog/application/use-cases/delete-module.use-case';
import { ModuleHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/module-has-dependencies-error';

@Controller('courses/:courseId/modules')
export class ModuleController {
  constructor(
    @Inject(CreateModuleUseCase)
    private readonly createModuleUseCase: CreateModuleUseCase,
    @Inject(GetModulesUseCase)
    private readonly getModulesUseCase: GetModulesUseCase,
    @Inject(GetModuleUseCase)
    private readonly getModuleUseCase: GetModuleUseCase,
    @Inject(DeleteModuleUseCase)
    private readonly deleteModuleUseCase: DeleteModuleUseCase,
  ) {}

  @Post()
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    const request = {
      courseId,
      slug: dto.slug,
      imageUrl: dto.imageUrl,
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

  @Get()
  async findAll(@Param('courseId') courseId: string) {
    const result = await this.getModulesUseCase.execute({ courseId });
    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      throw new InternalServerErrorException(error.message);
    }

    return result.value.modules;
  }

  @Get(':moduleId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const result = await this.getModuleUseCase.execute({ moduleId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError)
        throw new BadRequestException(err.details);
      if (err instanceof ModuleNotFoundError)
        throw new NotFoundException(err.message);
      throw new InternalServerErrorException(err.message);
    }
    return result.value.module;
  }

  @Delete(':moduleId')
  async delete(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const result = await this.deleteModuleUseCase.execute({ id: moduleId });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }

      if (error instanceof ModuleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ModuleHasDependenciesError) {
        // Incluir informações detalhadas sobre as dependências na resposta de erro
        const errorWithInfo = error as any;
        throw new ConflictException({
          message: error.message,
          statusCode: 409,
          error: 'Conflict',
          dependencyInfo: errorWithInfo.dependencyInfo,
        });
      }

      throw new InternalServerErrorException(error.message);
    }

    return result.value;
  }
}
