// src/infra/controllers/dtos/list-attempts-query.dto.ts

import { IsOptional, IsEnum, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListAttemptsQueryDto {
  @IsOptional()
  @IsEnum(['IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED'])
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  assessmentId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}