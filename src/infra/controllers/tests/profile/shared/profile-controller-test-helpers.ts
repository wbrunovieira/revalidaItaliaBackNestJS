// src/infra/controllers/tests/profile/shared/profile-controller-test-helpers.ts
import { right, left } from '@/core/either';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateCPFError } from '@/domain/auth/application/use-cases/errors/duplicate-cpf-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';

export function createSuccessResponse(userData: any) {
  return right({
    user: {
      id: userData.id || 'test-user-id',
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      phone: userData.phone,
      birthDate: userData.birthDate,
      profileImageUrl: userData.profileImageUrl,
      role: userData.role || 'student',
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    },
  });
}

export function createInvalidInputError(message: string, details: any[] = []) {
  return left(new InvalidInputError(message, details));
}

export function createDuplicateEmailError() {
  return left(new DuplicateEmailError());
}

export function createDuplicateCPFError() {
  return left(new DuplicateCPFError());
}

export function createResourceNotFoundError(message = 'User not found') {
  return left(new ResourceNotFoundError(message));
}

export function createGenericError(message = 'Unexpected error') {
  return left(new Error(message));
}