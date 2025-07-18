// src/infra/controllers/tests/profile/shared/profile-controller-test-data.ts
export function createValidUpdateProfileData() {
  return {
    name: 'John Updated',
    email: 'john.updated@example.com',
    cpf: '12345678901',
    phone: '+5511999999999',
    birthDate: new Date('1990-01-01'),
    profileImageUrl: 'https://example.com/profile.jpg',
  };
}

export function createPartialUpdateProfileData() {
  return {
    name: 'Jane Updated',
    phone: '+5511888888888',
  };
}

export function createInvalidEmailData() {
  return {
    email: 'invalid-email',
  };
}

export function createInvalidCPFData() {
  return {
    cpf: '123', // Too short
  };
}

export function createShortNameData() {
  return {
    name: 'Jo', // Too short
  };
}

export function createInvalidProfileImageUrlData() {
  return {
    profileImageUrl: 'not-a-valid-url',
  };
}

export function createEmptyUpdateData() {
  return {};
}

export function createUserPayload(userId = 'test-user-id', role = 'student') {
  return {
    sub: userId,
    role: role,
  };
}