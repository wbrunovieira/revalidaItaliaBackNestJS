// src/domain/course-catalog/application/dtos/create-track-request.dto.ts
export interface TrackTranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface CreateTrackRequest {
  slug: string;
  imageUrl?: string;
  courseIds: string[];
  translations: TrackTranslationDto[];
}
