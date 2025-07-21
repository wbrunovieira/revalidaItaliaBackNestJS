// src/domain/course-catalog/application/dtos/video-dependencies.dto.ts
export interface VideoDependencyInfo {
  canDelete: boolean;
  totalDependencies: number;
  summary: {
    videosSeen: number;
    translations: number;
    videoLinks: number;
  };
  dependencies: Array<{
    type: 'video_seen' | 'translation' | 'video_link';
    id: string;
    name: string;
    relatedEntities?: {
      userId?: string;
      identityId?: string;
      userName?: string;
      locale?: string;
    };
  }>;
}
