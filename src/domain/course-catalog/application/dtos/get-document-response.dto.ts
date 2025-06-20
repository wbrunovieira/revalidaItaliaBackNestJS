// src/domain/course-catalog/application/dtos/get-document-response.dto.ts
export interface GetDocumentResponseDto {
  document: {
    id: string;
    url: string;
    filename: string;
    title: string;
    fileSize: number;
    fileSizeInMB: number;
    mimeType: string;
    isDownloadable: boolean;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>;
  };
}
