// src/domain/course-catalog/application/dtos/update-document-request.dto.ts

export interface TranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
  url: string;
}

export interface UpdateDocumentRequest {
  id: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  isDownloadable?: boolean;
  translations?: TranslationDto[];
}