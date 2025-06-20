// ─────────────────────────────────────────────────────────────────
// src/infra/course-catalog/dtos/create-course.dto.ts
// ─────────────────────────────────────────────────────────────────
import {
  IsEnum,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  description: string;
}

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  slug: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  imageUrl: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[];
}
