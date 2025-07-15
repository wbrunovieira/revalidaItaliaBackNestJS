export class InvalidInputError extends Error {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message);
    this.name = 'InvalidInputError';
    this.details = details;
  }
}