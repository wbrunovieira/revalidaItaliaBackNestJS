// src/domain/course-catalog/application/use-cases/errors/document-has-dependencies-error.ts

import { DocumentDependencyInfo } from '../../dtos/document-dependencies.dto';

export class DocumentHasDependenciesError extends Error {
  constructor(
    dependencyNames: string[],
    public readonly dependencyInfo?: DocumentDependencyInfo,
  ) {
    const message = `Cannot delete document because it has dependencies: ${dependencyNames.join(', ')}`;
    super(message);
    this.name = 'DocumentHasDependenciesError';
  }
}