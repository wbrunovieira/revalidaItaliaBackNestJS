// src/domain/course-catalog/application/use-cases/errors/module-not-found-error.ts

export class ModuleNotFoundError extends Error {
  constructor(message = 'Module not found') {
    super(message);
    this.name = 'ModuleNotFoundError';
  }
}
