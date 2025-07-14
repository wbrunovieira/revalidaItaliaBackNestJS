// src/domain/assessment/application/dtos/submit-answer.dto.ts

import { IsUUID, IsOptional, IsString, ValidateIf } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  questionId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Selected option ID must be a valid UUID' })
  @ValidateIf((o) => o.selectedOptionId !== undefined)
  selectedOptionId?: string;

  @IsOptional()
  @IsString({ message: 'Text answer must be a string' })
  @ValidateIf((o) => o.textAnswer !== undefined)
  textAnswer?: string;
}