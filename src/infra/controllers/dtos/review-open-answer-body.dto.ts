// src/infra/controllers/dtos/review-open-answer-body.dto.ts

import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReviewOpenAnswerBodyDto {
  @IsUUID(4, { message: 'Reviewer ID must be a valid UUID' })
  reviewerId: string;

  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect: boolean;

  @IsOptional()
  @IsString({ message: 'Teacher comment must be a string' })
  @MinLength(1, { message: 'Teacher comment cannot be empty if provided' })
  @MaxLength(1000, { message: 'Teacher comment cannot exceed 1000 characters' })
  teacherComment?: string;
}
