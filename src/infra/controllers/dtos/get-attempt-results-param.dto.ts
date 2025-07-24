// src/infra/controllers/dtos/get-attempt-results-param.dto.ts

import { IsUUID } from 'class-validator';

export class GetAttemptResultsParamDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  id: string;
}
