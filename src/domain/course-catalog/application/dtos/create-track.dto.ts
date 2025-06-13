// src/infra/course-catalog/dtos/create-track.dto.ts
import { IsEnum, IsString, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackTranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  description: string;
}

export class CreateTrackDto {
  @IsString()
  @MinLength(3)
  slug: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackTranslationDto)
  translations: TrackTranslationDto[];

  @IsArray()
  @IsString({ each: true })
  courseIds: string[];
}