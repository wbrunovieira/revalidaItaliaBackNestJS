// src/infra/course-catalog/controllers/track.controller.ts
import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Get,
  Param,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';

import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';

import { GetTrackUseCase } from '@/domain/course-catalog/application/use-cases/get-track.use-case';
import { TrackNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/track-not-found-error';
import { GetTrackDto } from '@/domain/course-catalog/application/dtos/get-track.dto';
import { ListTracksUseCase } from '@/domain/course-catalog/application/use-cases/list-tracks.use-case';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';
import { DeleteTrackUseCase } from '@/domain/course-catalog/application/use-cases/delete-track.use-case';

@Controller('tracks')
export class TrackController {
  constructor(
    @Inject(CreateTrackUseCase)
    private readonly createTrackUseCase: CreateTrackUseCase,
    @Inject(GetTrackUseCase)
    private readonly getTrackUseCase: GetTrackUseCase,
    @Inject(ListTracksUseCase)
    private readonly listTracksUseCase: ListTracksUseCase,
    @Inject(DeleteTrackUseCase) // Adicionar esta injeção
    private readonly deleteTrackUseCase: DeleteTrackUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateTrackDto) {
    const request = {
      slug: dto.slug,
      imageUrl: dto.imageUrl,
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

  @Get(':id')
  async getById(@Param() params: GetTrackDto) {
    const result = await this.getTrackUseCase.execute({ id: params.id });
    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof TrackNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
    return (result.value as any).track;
  }

  @Get()
  async list() {
    const result = await this.listTracksUseCase.execute();
    if (result.isLeft()) {
      throw new InternalServerErrorException(result.value.message);
    }
    return (result.value as any).tracks;
  }

  @Delete(':id')
  async delete(@Param() params: GetTrackDto) {
    const result = await this.deleteTrackUseCase.execute({ id: params.id });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof TrackNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException(error.message);
    }

    return result.value;
  }
}
