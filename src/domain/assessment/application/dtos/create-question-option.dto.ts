// src/domain/assessment/application/dtos/create-question-option.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString({ message: 'Option text must be a string' })
  @IsNotEmpty({ message: 'Option text cannot be empty' })
  text: string;
}
