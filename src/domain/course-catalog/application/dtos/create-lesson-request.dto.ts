// src/domain/course-catalog/application/dtos/create-lesson-request.dto.ts
import { TranslationDto } from './translation.dto';

export interface CreateLessonRequest {
  moduleId: string;
  order: number;
  imageUrl?: string;
  translations: TranslationDto[];
  videoId?: string;
}
