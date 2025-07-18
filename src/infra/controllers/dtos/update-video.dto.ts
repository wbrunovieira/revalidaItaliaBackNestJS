import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  IsInt,
  Min,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

export class VideoTranslationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pt', 'it', 'es'])
  locale: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  description: string
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug?: string

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  providerVideoId?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  durationInSeconds?: number

  @IsOptional()
  @IsUUID()
  lessonId?: string | null

  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => VideoTranslationDto)
  translations?: VideoTranslationDto[]
}