// src/domain/course-catalog/application/dtos/update-lesson.dto.ts

import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLessonTranslationDto {
  @IsIn(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLessonTranslationDto)
  translations?: UpdateLessonTranslationDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  videoId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flashcardIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quizIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commentIds?: string[];
}
