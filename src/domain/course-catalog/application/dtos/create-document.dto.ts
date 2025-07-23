// src/domain/course-catalog/application/dtos/create-document.dto.ts
import {
  IsString,
  IsUUID,
  MinLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
  IsNumber,
  IsPositive,
  Max,
  IsBoolean,
  IsOptional,
  Matches,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentTranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale!: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsUrl({}, { message: 'Invalid URL format' })
  url!: string;
}

export class CreateDocumentDto {
  @IsUUID(4, { message: 'Lesson ID must be a valid UUID' })
  lessonId!: string;

  @IsString()
  @MinLength(1, { message: 'Filename is required' })
  @Matches(/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/, {
    message: 'Invalid filename format (must include extension)',
  })
  filename!: string;

  @IsArray()
  @ArrayMinSize(3, {
    message: 'Exactly three translations required (pt, it & es)',
  })
  @ArrayMaxSize(3, {
    message: 'Exactly three translations required (pt, it & es)',
  })
  @ValidateNested({ each: true })
  @Type(() => DocumentTranslationDto)
  translations!: DocumentTranslationDto[];
}
