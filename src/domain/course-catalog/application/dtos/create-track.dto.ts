// src/infra/course-catalog/dtos/create-track.dto.ts
import {
  IsEnum,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TrackTranslationDto {
  @IsEnum(['pt', 'it', 'es'])
  locale: 'pt' | 'it' | 'es';

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  description: string;
}

export class CreateTrackDto {
  @IsString()
  @MinLength(3)
  slug: string;

  @IsOptional()
  @IsString()
  // Permite caminhos relativos no frontend (/images/...) ou URLs absolutas
  @ValidateIf(
    (o) => typeof o.imageUrl === 'string' && o.imageUrl.startsWith('/'),
  )
  @Matches(/^\/.*$/, {
    message: 'imageUrl must be an absolute path like "/images/..."',
  })
  @ValidateIf(
    (o) => typeof o.imageUrl === 'string' && !o.imageUrl.startsWith('/'),
  )
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackTranslationDto)
  translations: TrackTranslationDto[];

  @IsArray()
  @IsString({ each: true })
  courseIds: string[];
}
