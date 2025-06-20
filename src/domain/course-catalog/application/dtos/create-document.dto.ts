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
}

export class CreateDocumentDto {
  @IsUUID(4, { message: 'Lesson ID must be a valid UUID' })
  lessonId!: string;

  @IsUrl({}, { message: 'Invalid URL format' })
  url!: string;

  @IsString()
  @MinLength(1, { message: 'Filename is required' })
  @Matches(/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/, {
    message: 'Invalid filename format (must include extension)',
  })
  filename!: string;

  @IsNumber()
  @IsPositive({ message: 'File size must be positive' })
  @Max(50 * 1024 * 1024, { message: 'File size cannot exceed 50MB' })
  fileSize!: number;

  @IsString()
  @IsEnum(
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    { message: 'Unsupported file type' },
  )
  mimeType!: string;

  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean;

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
