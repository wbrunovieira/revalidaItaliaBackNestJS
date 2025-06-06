// src/domain/course-catalog/application/dtos/create-module-request.dto.ts
export interface CreateModuleRequest {
  courseId: string;
  slug: string;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }>;
  order: number;
}