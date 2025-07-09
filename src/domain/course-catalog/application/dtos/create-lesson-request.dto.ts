// src/domain/course-catalog/application/dtos/create-lesson-request.dto.ts
import { TranslationDto } from './translation.dto';

export interface CreateLessonRequest {
  slug: string;
  moduleId: string;
  order: number;
  imageUrl?: string;
  translations: TranslationDto[];
  videoId?: string; // Video existente para associar (será atualizado com lessonId)
  flashcardIds?: string[];
  commentIds?: string[];
}
