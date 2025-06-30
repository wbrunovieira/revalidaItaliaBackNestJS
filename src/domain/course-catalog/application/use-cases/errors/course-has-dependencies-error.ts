// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/errors/course-has-dependencies-error.ts
// ═══════════════════════════════════════════════════════════════════

import { CourseDependencyInfo } from '../../dtos/course-dependencies.dto';

export class CourseHasDependenciesError extends Error {
  public readonly dependencyInfo?: CourseDependencyInfo;

  constructor(
    dependencies: string[] = [],
    dependencyInfo?: CourseDependencyInfo,
  ) {
    const dependencyList =
      dependencies.length > 0 ? `: ${dependencies.join(', ')}` : '';
    super(`Cannot delete course because it has dependencies${dependencyList}`);
    this.name = 'CourseHasDependenciesError';
    this.dependencyInfo = dependencyInfo;
  }
}
