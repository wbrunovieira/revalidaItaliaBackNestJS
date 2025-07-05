// src/domain/course-catalog/application/dtos/update-module.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsIn,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateModuleTranslationDto {
  @IsIn(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\/\S+|https?:\/\/\S+)$/, {
    message: 'imageUrl must be a valid URL or a path starting with "/"',
  })
  imageUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModuleTranslationDto)
  translations?: UpdateModuleTranslationDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
