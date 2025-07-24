// src/domain/course-catalog/application/dtos/create-document-request.dto.ts
export interface DocumentTranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
  url: string;
}

export interface CreateDocumentRequest {
  lessonId: string;
  filename: string;
  translations: DocumentTranslationDto[];
}
