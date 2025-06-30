// src/domain/course-catalog/application/dtos/update-course-request.dto.ts
// ═══════════════════════════════════════════════════════════════════

import { CourseTranslationVO } from '@/domain/course-catalog/enterprise/entities/course.entity';

export interface UpdateCourseRequest {
  id: string;
  slug?: string;
  imageUrl?: string;
  translations?: CourseTranslationVO[];
}
