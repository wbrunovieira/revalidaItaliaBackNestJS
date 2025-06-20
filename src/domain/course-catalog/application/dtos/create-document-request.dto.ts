// src/domain/course-catalog/application/dtos/create-document-request.dto.ts
export interface DocumentTranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface CreateDocumentRequest {
  lessonId: string;
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isDownloadable?: boolean;
  translations: DocumentTranslationDto[];
}
