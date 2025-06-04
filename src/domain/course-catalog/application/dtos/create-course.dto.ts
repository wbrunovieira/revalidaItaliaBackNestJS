// src/infra/course-catalog/dtos/create-course.dto.ts
import {
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class TranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es'

  @IsString()
  @MinLength(3)
  title: string

  @IsString()
  @MinLength(5)
  description: string
}

export class CreateModuleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[]

  @IsInt()
  @Min(1)
  order: number
}

export class CreateCourseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleDto)
  modules?: CreateModuleDto[]
}