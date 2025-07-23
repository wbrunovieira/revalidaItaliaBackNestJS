// src/domain/course-catalog/application/dtos/get-document-response.dto.ts
export interface GetDocumentResponseDto {
  document: {
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
  };
}
