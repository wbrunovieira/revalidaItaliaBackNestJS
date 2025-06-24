// src/domain/course-catalog/application/dtos/create-lesson-request.dto.ts
import { TranslationDto } from './translation.dto';

export interface CreateLessonRequest {
  moduleId: string;
  imageUrl?: string;
  translations: TranslationDto[];
  videoId?: string;
}
