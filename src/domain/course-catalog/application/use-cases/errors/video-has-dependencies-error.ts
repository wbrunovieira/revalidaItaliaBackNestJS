// src/domain/course-catalog/application/use-cases/errors/video-has-dependencies-error.ts
import { VideoDependencyInfo } from '../../dtos/video-dependencies.dto';

export class VideoHasDependenciesError extends Error {
  constructor(
    dependencyNames: string[],
    public readonly dependencyInfo?: VideoDependencyInfo,
  ) {
    const dependencyList = dependencyNames.join(', ');
    super(
      `Cannot delete video because it has dependencies: ${dependencyList}. ` +
        `Please remove these dependencies first before deleting the video.`,
    );
    this.name = 'VideoHasDependenciesError';
  }
}
