// src/infra/course-catalog/controllers/track.controller.ts
import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';

import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';

@Controller('tracks')
export class TrackController {
  constructor(
    @Inject(CreateTrackUseCase)
    private readonly createTrackUseCase: CreateTrackUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateTrackDto) {
    const request = {
      slug: dto.slug,
      courseIds: dto.courseIds,
      translations: dto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

    const result = await this.createTrackUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof DuplicateTrackError) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    return (result.value as any).track;
  }
}