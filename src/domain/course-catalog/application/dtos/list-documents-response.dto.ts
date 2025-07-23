// src/domain/course-catalog/application/dtos/list-documents-response.dto.ts
export interface ListDocumentsResponseDto {
  documents: Array<{
    id: string;
    filename: string;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
      url: string;
    }>;
  }>;
}
