// src/infra/course-catalog/dtos/create-course.dto.ts
import {
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateModuleDto {
  @IsString()
  @MinLength(1)
  title: string

  @IsInt()
  @Min(1)
  order: number
}

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title: string

  @IsString()
  @MinLength(5)
  description: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleDto)
  modules?: CreateModuleDto[]
}