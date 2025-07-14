// src/domain/assessment/application/dtos/get-answer-params.dto.ts

import { IsUUID } from 'class-validator';

export class GetAnswerParamsDto {
  @IsUUID('4', { message: 'Answer ID must be a valid UUID' })
  id: string;
}