// src/domain/assessment/application/dtos/create-assessment.dto.ts
import {
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  ValidateIf,
  IsInt,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA'])
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';

  @ValidateIf((o) => o.type === 'QUIZ')
  @IsEnum(['BEFORE_LESSON', 'AFTER_LESSON'])
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';

  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @ValidateIf((o) => o.type === 'SIMULADO')
  @IsNumber()
  @IsInt()
  @Min(1)
  timeLimitInMinutes?: number;

  @IsBoolean()
  randomizeQuestions: boolean = false;

  @IsBoolean()
  randomizeOptions: boolean = false;

  @ValidateIf((o) => o.type === 'QUIZ')
  @IsUUID()
  lessonId?: string;
}