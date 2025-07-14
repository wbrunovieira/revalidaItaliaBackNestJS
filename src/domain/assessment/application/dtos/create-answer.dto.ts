// src/domain/assessment/application/dtos/create-answer.dto.ts

import { IsString, IsUUID, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class CreateAnswerTranslationDto {
  @IsIn(['pt', 'it', 'es'], { message: 'Locale must be pt, it, or es' })
  locale: 'pt' | 'it' | 'es';

  @IsString({ message: 'Translation explanation must be a string' })
  explanation: string;
}

export class CreateAnswerDto {
  @IsOptional()
  @IsUUID('4', { message: 'Correct option ID must be a valid UUID' })
  correctOptionId?: string;

  @IsString({ message: 'Explanation must be a string' })
  explanation: string;

  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  questionId: string;

  @IsOptional()
  @IsArray({ message: 'Translations must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerTranslationDto)
  translations?: CreateAnswerTranslationDto[];
}