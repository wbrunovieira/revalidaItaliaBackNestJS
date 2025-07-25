// test/e2e/profile/shared/profile-e2e-test-helpers.ts
import { JwtService } from '@nestjs/jwt';

export function generateValidJwtToken(
  jwtService: JwtService,
  payload: { sub: string; role: string },
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  return `${header}.${payloadEncoded}.fake-signature`;
}

export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

export function expectValidProfileResponse(responseBody: any) {
  expect(responseBody).toHaveProperty('identity');
  expect(responseBody).toHaveProperty('profile');
  
  expect(responseBody.identity).toHaveProperty('id');
  expect(responseBody.identity).toHaveProperty('email');
  
  expect(responseBody.profile).toHaveProperty('fullName');
  expect(responseBody.profile).toHaveProperty('nationalId');
  expect(responseBody.profile).toHaveProperty('phone');
  expect(responseBody.profile).toHaveProperty('birthDate');
  expect(responseBody.profile).toHaveProperty('profileImageUrl');
  
  expect(responseBody).not.toHaveProperty('password');
}

export function expectValidationError(responseBody: any) {
  expect(responseBody).toHaveProperty('detail');
  expect(responseBody).toHaveProperty('status');
  expect(responseBody.status).toBe(400);
}
