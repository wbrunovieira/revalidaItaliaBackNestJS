// src/domain/auth/application/use-cases/errors/invalid-input-error.ts
export class InvalidInputError extends Error {
  constructor(
    public readonly message: string,
    public readonly details: unknown[],
  ) {
    super(message);
  }
}
