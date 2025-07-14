// src/domain/assessment/application/dtos/submit-attempt-param.dto.ts

import { IsUUID } from 'class-validator';

export class SubmitAttemptParamDto {
  @IsUUID('4', { message: 'Attempt ID must be a valid UUID' })
  id: string;
}