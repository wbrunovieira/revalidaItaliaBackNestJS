// src/domain/course-catalog/application/use-cases/errors/lesson-has-dependencies-error.ts

import { LessonDependencyInfo } from '../../dtos/lesson-dependencies.dto';

export class LessonHasDependenciesError extends Error {
  constructor(
    dependencyNames: string[],
    public readonly dependencyInfo: LessonDependencyInfo,
  ) {
    const message = `Cannot delete lesson because it has dependencies: ${dependencyNames.join(', ')}`;
    super(message);
    this.name = 'LessonHasDependenciesError';
  }
}
