// src/domain/assessment/application/use-cases/errors/duplicate-argument-error.ts

export class DuplicateArgumentError extends Error {
  constructor() {
    super('Argument with this title already exists');
    this.name = 'DuplicateArgumentError';
  }
}