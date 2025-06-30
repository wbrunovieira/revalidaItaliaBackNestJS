// src/domain/course-catalog/application/dtos/track-dependencies.dto.ts
export interface TrackDependency {
  type: 'course';
  name: string;
  slug: string;
  id: string;
}
export interface TrackDependencyInfo {
  canDelete: boolean;
  totalDependencies: number;
  summary: {
    courses: number;
  };
  dependencies: TrackDependency[];
}
