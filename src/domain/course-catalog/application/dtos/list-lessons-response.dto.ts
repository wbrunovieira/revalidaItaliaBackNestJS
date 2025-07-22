// src/domain/course-catalog/application/dtos/list-lessons-response.dto.ts
import { TranslationDto } from './translation.dto';

export interface LessonDto {
  id: string;
  moduleId: string;
  videoId?: string;
  imageUrl?: string;
  order: number;
  translations: TranslationDto[];
  createdAt: Date;
  updatedAt: Date;

  video?: {
    id: string;
    slug: string;
    title: string;
    providerVideoId: string;
    durationInSeconds: number;
    isSeen: boolean;
  };
}

export interface ListLessonsResponse {
  lessons: LessonDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
