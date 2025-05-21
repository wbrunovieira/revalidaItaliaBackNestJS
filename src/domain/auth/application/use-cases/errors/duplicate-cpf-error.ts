// duplicate-email-error.ts
export class DuplicateCPFError extends Error {
  constructor() {
    super('CPF already exists');
    this.name = 'DuplicateCPFError';
  }
}