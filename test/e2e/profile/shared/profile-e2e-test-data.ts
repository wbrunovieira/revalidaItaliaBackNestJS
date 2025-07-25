// test/e2e/profile/shared/profile-e2e-test-data.ts

export const testUserIds = {
  mainUser: '550e8400-e29b-41d4-a716-446655440001',
  otherUser: '550e8400-e29b-41d4-a716-446655440002',
};

export const testEmails = [
  'profile-e2e-test@example.com',
  'profile-e2e-other@example.com',
  'profile-e2e-duplicate-email@example.com',
  'profile-e2e-duplicate-cpf@example.com',
];

export function createMainTestUser() {
  return {
    id: testUserIds.mainUser,
    fullName: 'Profile Test User',
    email: testEmails[0],
    password: 'Test123!@#',
    nationalId: '12345678901',
    role: 'student' as const,
    phone: '+5511999999999',
    birthDate: new Date('1990-01-01'),
    profileImageUrl: 'https://example.com/old-profile.jpg',
  };
}

export function createOtherTestUser() {
  return {
    id: testUserIds.otherUser,
    fullName: 'Other Test User',
    email: testEmails[1],
    password: 'Test123!@#',
    nationalId: '98765432101',
    role: 'student' as const,
  };
}

export function createValidUpdateData() {
  return {
    fullName: 'Updated Profile Name',
    email: 'profile-updated@example.com',
    nationalId: '11111111111',
    phone: '+5511888888888',
    birthDate: '1995-05-15',
    profileImageUrl: 'https://example.com/new-profile.jpg',
  };
}

export function createPartialUpdateData() {
  return {
    fullName: 'Only Name Updated',
    phone: '+5511777777777',
  };
}

export function createInvalidEmailData() {
  return {
    email: 'not-an-email',
  };
}

export function createInvalidCPFData() {
  return {
    nationalId: '12', // Too short (minimum is 3)
  };
}

export function createShortNameData() {
  return {
    fullName: 'Ab', // Too short
  };
}

export function createInvalidProfileImageData() {
  return {
    profileImageUrl: 'not-a-url',
  };
}

export function createDuplicateEmailData() {
  return {
    email: testEmails[1], // Other user's email
  };
}

export function createDuplicateCPFData() {
  return {
    nationalId: '98765432101', // Other user's nationalId
  };
}
