// src/infra/controllers/tests/profile/shared/profile-controller-test-helpers.ts
import { right, left } from '@/core/either';
import {
  InvalidInputError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  ResourceNotFoundError,
} from '@/domain/auth/domain/exceptions';

export function createSuccessResponse(userData: any) {
  return right({
    identity: {
      id: userData.id || 'test-user-id',
      email: userData.email,
    },
    profile: {
      fullName: userData.fullName || userData.name,
      nationalId: userData.nationalId || userData.cpf,
      phone: userData.phone,
      birthDate: userData.birthDate,
      profileImageUrl: userData.profileImageUrl,
    },
  });
}

export function createInvalidInputError(message: string, details: any[] = []) {
  return left(new InvalidInputError(message, details));
}

export function createDuplicateEmailError(email = 'test@example.com') {
  return left(new DuplicateEmailError(email));
}

export function createDuplicateNationalIdError(nationalId = '12345678901') {
  return left(new DuplicateNationalIdError(nationalId));
}

export function createResourceNotFoundError(message = 'User not found') {
  return left(new ResourceNotFoundError('User', {}, undefined, message));
}

export function createGenericError(message = 'Unexpected error') {
  return left(new Error(message));
}
