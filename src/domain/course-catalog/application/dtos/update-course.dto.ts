// src/domain/course-catalog/application/dtos/update-course.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TranslationDto } from './create-course.dto';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  slug?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => TranslationDto)
  @ValidateNested({ each: true })
  @IsArray()
  translations?: TranslationDto[];
}
