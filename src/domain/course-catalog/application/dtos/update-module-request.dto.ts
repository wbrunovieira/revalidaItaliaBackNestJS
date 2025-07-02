// src/domain/course-catalog/application/dtos/update-module-request.dto.ts

export interface UpdateModuleTranslationRequest {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface UpdateModuleRequest {
  id: string;
  slug?: string;
  imageUrl?: string | null;
  translations?: UpdateModuleTranslationRequest[];
  order?: number;
}
