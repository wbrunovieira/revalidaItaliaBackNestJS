// src/domain/course-catalog/application/dtos/translation.dto.ts
export interface TranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}