// src/infra/course-catalog/controllers/create-module.dto.ts
import {
  IsEnum,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleTranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  description: string;
}

export class CreateModuleDto {
  @IsString()
  @MinLength(3)
  slug: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleTranslationDto)
  translations: ModuleTranslationDto[];

  @IsInt()
  @Min(1)
  order: number;
}