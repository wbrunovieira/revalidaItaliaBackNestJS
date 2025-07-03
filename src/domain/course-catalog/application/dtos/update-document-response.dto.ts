// src/domain/course-catalog/application/dtos/update-document-response.dto.ts

import { Document } from '../../enterprise/entities/document.entity';

export interface TranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
  url: string;
}

export interface UpdateDocumentResponse {
  document: Document;
  translations: TranslationDto[];
}