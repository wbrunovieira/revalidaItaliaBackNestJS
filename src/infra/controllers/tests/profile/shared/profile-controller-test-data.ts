// src/infra/controllers/tests/profile/shared/profile-controller-test-data.ts
export function createValidUpdateProfileData() {
  return {
    fullName: 'John Updated',
    email: 'john.updated@example.com',
    nationalId: '12345678901',
    phone: '+5511999999999',
    birthDate: '1990-01-01',
    profileImageUrl: 'https://example.com/profile.jpg',
  };
}

export function createPartialUpdateProfileData() {
  return {
    fullName: 'Jane Updated',
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
    nationalId: '12', // Too short - less than 3 characters
  };
}

export function createShortNameData() {
  return {
    fullName: 'Jo', // Too short
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
