// src/domain/course-catalog/application/dtos/module-dependencies.dto.ts

export interface ModuleDependency {
  type: 'lesson' | 'video';
  id: string;
  name: string;
  relatedEntities?: {
    videos?: number;
    documents?: number;
    flashcards?: number;
    quizzes?: number;
  };
}

export interface ModuleDependencyInfo {
  canDelete: boolean;
  totalDependencies: number;
  summary: {
    lessons: number;
    videos: number;
  };
  dependencies: ModuleDependency[];
}
