// src/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error.ts
export class DuplicateModuleOrderError extends Error {
  constructor() {
    super('Module order already exists for this course');
    this.name = 'DuplicateModuleOrderError';
  }
}