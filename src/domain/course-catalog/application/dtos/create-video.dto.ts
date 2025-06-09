// src/domain/course-catalog/application/dtos/create-video.dto.ts

import {
  IsString,
  IsUUID,
  MinLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VideoTranslationDto {
  @IsString()
  @MinLength(2)
  locale!: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(5)
  description!: string;
}

export class CreateVideoDto {
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  slug!: string;

  @IsString()
  @MinLength(1, { message: 'Provider video ID is required' })
  providerVideoId!: string;

  @IsArray()
  @ArrayMinSize(3, { message: 'Exactly three translations required (pt, it & es)' })
  @ArrayMaxSize(3, { message: 'Exactly three translations required (pt, it & es)' })
  @ValidateNested({ each: true })
  @Type(() => VideoTranslationDto)
  translations!: VideoTranslationDto[];
}