// src/domain/assessment/application/dtos/start-attempt.dto.ts

import { IsUUID, IsNotEmpty } from 'class-validator';

export class StartAttemptDto {
  @IsUUID('4', { message: 'Identity ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Identity ID is required' })
  identityId: string;

  @IsUUID('4', { message: 'Assessment ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Assessment ID is required' })
  assessmentId: string;
}
