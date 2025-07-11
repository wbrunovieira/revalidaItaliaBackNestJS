// src/domain/assessment/application/dtos/create-argument.dto.ts
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateArgumentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsUUID()
  assessmentId?: string;
}