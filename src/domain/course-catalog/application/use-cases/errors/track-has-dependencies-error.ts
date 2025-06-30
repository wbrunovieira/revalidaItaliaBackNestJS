// src/domain/course-catalog/application/use-cases/errors/track-has-dependencies-error.ts

import { TrackDependencyInfo } from '../../dtos/track-dependencies.dto';

export class TrackHasDependenciesError extends Error {
  public readonly dependencyInfo?: TrackDependencyInfo;

  constructor(
    dependencies: string[] = [],
    dependencyInfo?: TrackDependencyInfo,
  ) {
    const dependencyList =
      dependencies.length > 0 ? `: ${dependencies.join(', ')}` : '';
    super(
      `Cannot delete track because it has associated courses${dependencyList}`,
    );
    this.name = 'TrackHasDependenciesError';
    this.dependencyInfo = dependencyInfo;
  }
}
