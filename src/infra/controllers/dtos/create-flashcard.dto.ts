// src/infra/controllers/dtos/create-flashcard.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  ValidateNested,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class FlashcardContentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['TEXT', 'IMAGE'])
  type: 'TEXT' | 'IMAGE';

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}

export class CreateFlashcardDto {
  @ValidateNested()
  @Type(() => FlashcardContentDto)
  question: FlashcardContentDto;

  @ValidateNested()
  @Type(() => FlashcardContentDto)
  answer: FlashcardContentDto;

  @IsUUID()
  @IsNotEmpty()
  argumentId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  importBatchId?: string;
}