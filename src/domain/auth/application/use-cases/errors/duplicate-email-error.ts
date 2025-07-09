// duplicate-email-error.ts
export class DuplicateEmailError extends Error {
  constructor() {
    super('User already exists');
    this.name = 'DuplicateEmailError';
  }
}
