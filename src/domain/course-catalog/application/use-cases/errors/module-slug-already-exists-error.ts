// src/domain/course-catalog/application/use-cases/errors/module-slug-already-exists-error.ts

export class ModuleSlugAlreadyExistsError extends Error {
  constructor(slug: string) {
    super(`Module with slug "${slug}" already exists`);
    this.name = 'ModuleSlugAlreadyExistsError';
  }
}
