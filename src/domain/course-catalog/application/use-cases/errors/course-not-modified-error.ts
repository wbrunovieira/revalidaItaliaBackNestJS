// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/errors/course-not-modified-error.ts
// ═══════════════════════════════════════════════════════════════════

export class CourseNotModifiedError extends Error {
  constructor() {
    super('No changes detected in course data');
    this.name = 'CourseNotModifiedError';
  }
}
