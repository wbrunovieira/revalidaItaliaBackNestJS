// src/infra/course-catalog/controllers/dtos/update-track.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateTrackTranslationDto {
  @IsString()
  locale: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class UpdateTrackDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTrackTranslationDto)
  translations?: UpdateTrackTranslationDto[];
}
