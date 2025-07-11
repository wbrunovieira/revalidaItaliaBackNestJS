// src/infra/controllers/argument.controller.ts
import { CreateArgumentDto } from '@/domain/assessment/application/dtos/create-argument.dto';
import { CreateArgumentUseCase } from '@/domain/assessment/application/use-cases/create-argument.use-case';
import { GetArgumentUseCase } from '@/domain/assessment/application/use-cases/get-argument.use-case';
import { DuplicateArgumentError } from '@/domain/assessment/application/use-cases/errors/duplicate-argument-error';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ListArgumentsUseCase } from '@/domain/assessment/application/use-cases/list-arguments.use-case';

@Controller('arguments')
export class ArgumentController {
  constructor(
    @Inject(CreateArgumentUseCase)
    private readonly createArgumentUseCase: CreateArgumentUseCase,
    @Inject(GetArgumentUseCase)
    private readonly getArgumentUseCase: GetArgumentUseCase,
    @Inject(ListArgumentsUseCase)
    private readonly listArgumentsUseCase: ListArgumentsUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateArgumentDto) {
    const request = {
      title: dto.title,
      assessmentId: dto.assessmentId,
    };

    const result = await this.createArgumentUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof DuplicateArgumentError) {
        throw new ConflictException({
          error: 'DUPLICATE_ARGUMENT',
          message: error.message,
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

    const { argument } = result.value as any;
    return {
      success: true,
      argument,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const request = { id };

    const result = await this.getArgumentUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof ArgumentNotFoundError) {
        throw new NotFoundException({
          error: 'ARGUMENT_NOT_FOUND',
          message: 'Argument not found',
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

    const { argument } = result.value;
    return {
      success: true,
      argument,
    };
  }

  @Get()
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('assessmentId') assessmentId?: string,
  ) {
    const request = {
      page,
      limit,
      assessmentId,
    };

    const result = await this.listArgumentsUseCase.execute(request);

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

    const { arguments: items, pagination } = result.value;

    // Os items já são DTOs, não entidades, então não precisam de toResponseObject()
    return {
      success: true,
      arguments: items,
      pagination,
    };
  }
}
