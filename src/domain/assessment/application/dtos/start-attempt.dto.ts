// src/domain/assessment/application/dtos/start-attempt.dto.ts

import { IsUUID, IsNotEmpty } from 'class-validator';

export class StartAttemptDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsUUID('4', { message: 'Assessment ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Assessment ID is required' })
  assessmentId: string;
}