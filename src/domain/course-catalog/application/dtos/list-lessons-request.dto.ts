// src/domain/course-catalog/application/dtos/list-lessons-request.dto.ts
export interface ListLessonsRequest {
  moduleId: string;
  page?: number;
  limit?: number;
  includeVideo?: boolean;
}
