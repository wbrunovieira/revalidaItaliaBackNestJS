// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/dtos/course-dependencies.dto.ts
// ═══════════════════════════════════════════════════════════════════

export interface CourseDependencyInfo {
  canDelete: boolean;
  dependencies: CourseDependency[];
  totalDependencies: number;
  summary: {
    modules: number;
    tracks: number;
    lessons: number;
    videos: number;
  };
}

export interface CourseDependency {
  type: 'module' | 'track' | 'lesson' | 'video';
  id: string;
  name: string;
  description?: string;
  actionRequired: string;
  relatedEntities?: {
    lessons?: number;
    videos?: number;
  };
}
