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
  IsUrl,
  ValidateIf,
  Matches,
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

  @ValidateIf(
    (o) => typeof o.imageUrl === 'string' && o.imageUrl.startsWith('/'),
  )
  @Matches(/^\/.*$/, {
    message: 'imageUrl must be an absolute path like "/images/..."',
  })
  @ValidateIf(
    (o) => typeof o.imageUrl === 'string' && !o.imageUrl.startsWith('/'),
  )
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[];
}
