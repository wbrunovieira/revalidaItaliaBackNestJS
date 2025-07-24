// src/infra/controllers/dtos/review-open-answer-param.dto.ts

import { IsUUID } from 'class-validator';

export class ReviewOpenAnswerParamDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  id: string;
}
