// src/domain/assessment/application/dtos/update-assessment.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsEnum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA'])
  type?: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';

  @IsOptional()
  @ValidateIf((o) => o.quizPosition !== null)
  @IsEnum(['BEFORE_LESSON', 'AFTER_LESSON'])
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON' | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @ValidateIf((o) => o.timeLimitInMinutes !== null)
  @IsNumber()
  @Min(1)
  timeLimitInMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.lessonId !== null && o.lessonId !== undefined)
  @IsUUID()
  lessonId?: string | null;
}
