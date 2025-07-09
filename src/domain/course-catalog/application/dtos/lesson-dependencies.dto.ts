// src/domain/course-catalog/application/dtos/lesson-dependencies.dto.ts
export interface LessonDependency {
  type: 'video' | 'document' | 'flashcard' | 'assessment' | 'comment';
  id: string;
  name: string;
  relatedEntities?: {
    translations?: number;
  };
}

export interface LessonDependencyInfo {
  canDelete: boolean;
  totalDependencies: number;
  summary: {
    videos: number;
    documents: number;
    flashcards: number;
    assessments: number;
    comments: number;
  };
  dependencies: LessonDependency[];
}
