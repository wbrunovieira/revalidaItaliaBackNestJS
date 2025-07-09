// src/domain/course-catalog/application/dtos/document-dependencies.dto.ts

export interface DocumentDependencyInfo {
  canDelete: boolean;
  totalDependencies: number;
  summary: {
    downloads: number;
    translations: number;
  };
  dependencies: Array<{
    type: 'download' | 'translation';
    id: string;
    name: string;
    relatedEntities?: {
      userId?: string;
      userName?: string;
      downloadedAt?: Date;
      locale?: string;
      title?: string;
    };
  }>;
}
