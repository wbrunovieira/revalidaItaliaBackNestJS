// src/domain/course-catalog/application/dtos/document-response.dto.ts
export interface DocumentResponseDto {
  document: {
    id: string;
    filename: string;
    createdAt: Date;
    updatedAt: Date;
  };
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
    url: string;
  }>;
}
