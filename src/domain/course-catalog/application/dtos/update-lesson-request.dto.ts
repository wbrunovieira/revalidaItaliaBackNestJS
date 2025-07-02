// src/domain/course-catalog/application/dtos/update-lesson-request.dto.ts

export interface UpdateLessonTranslationRequest {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

export interface UpdateLessonRequest {
  id: string;
  imageUrl?: string | null;
  translations?: UpdateLessonTranslationRequest[];
  order?: number;
  videoId?: string | null;
  flashcardIds?: string[];
  quizIds?: string[];
  commentIds?: string[];
}
