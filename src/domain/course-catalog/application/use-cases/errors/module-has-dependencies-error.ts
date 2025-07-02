// src/domain/course-catalog/application/use-cases/errors/module-has-dependencies-error.ts

import { ModuleDependencyInfo } from '../../dtos/module-dependencies.dto';

export class ModuleHasDependenciesError extends Error {
  constructor(
    dependencyNames: string[],
    public readonly dependencyInfo: ModuleDependencyInfo,
  ) {
    const message = `Cannot delete module because it has dependencies: ${dependencyNames.join(', ')}`;
    super(message);
    this.name = 'ModuleHasDependenciesError';
  }
}
