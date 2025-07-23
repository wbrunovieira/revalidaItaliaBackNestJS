import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsUrl,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class VideoProgressDto {
  @ApiProperty({
    description: 'Current playback time in seconds',
    example: 245.7,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  currentTime: number;

  @ApiProperty({
    description: 'Total video duration in seconds',
    example: 600,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  duration: number;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 40.95,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class SaveLessonProgressDto {
  @ApiProperty({
    description: 'Lesson ID',
    example: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
  })
  @IsUUID('all')
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({
    description: 'Lesson title',
    example: 'Introdução à Anatomia',
  })
  @IsString()
  @IsNotEmpty()
  lessonTitle: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
  })
  @IsUUID('all')
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Course title',
    example: 'Revalida Medicina',
  })
  @IsString()
  @IsNotEmpty()
  courseTitle: string;

  @ApiProperty({
    description: 'Course slug',
    example: 'curso-teste-pt',
  })
  @IsString()
  @IsNotEmpty()
  courseSlug: string;

  @ApiProperty({
    description: 'Module ID',
    example: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
  })
  @IsUUID('all')
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    description: 'Module title',
    example: 'Anatomia Básica',
  })
  @IsString()
  @IsNotEmpty()
  moduleTitle: string;

  @ApiProperty({
    description: 'Module slug',
    example: 'modulo-1',
  })
  @IsString()
  @IsNotEmpty()
  moduleSlug: string;

  @ApiProperty({
    description: 'Lesson image URL',
    example: '/images/lesson-anatomy.jpg',
  })
  @IsString()
  @IsNotEmpty()
  lessonImageUrl: string;

  @ApiProperty({
    description: 'Video progress information',
    type: VideoProgressDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VideoProgressDto)
  videoProgress: VideoProgressDto;
}