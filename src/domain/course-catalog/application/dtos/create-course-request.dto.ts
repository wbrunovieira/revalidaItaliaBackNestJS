// ─────────────────────────────────────────────────────────────────
// src/domain/course-catalog/application/dtos/create-course-request.dto.ts
// ─────────────────────────────────────────────────────────────────
export interface CreateCourseRequest {
  slug: string;

  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }>;
}