// src/domain/course-catalog/application/dtos/create-video-request.dto.ts

export interface TranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface CreateVideoRequest {
  moduleId: string;
  slug: string;
  providerVideoId: string;
  translations: TranslationDto[];
}