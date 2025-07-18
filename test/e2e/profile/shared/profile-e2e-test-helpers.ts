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
  expect(responseBody).toHaveProperty('id');
  expect(responseBody).toHaveProperty('name');
  expect(responseBody).toHaveProperty('email');
  expect(responseBody).toHaveProperty('cpf');
  expect(responseBody).toHaveProperty('role');
  expect(responseBody).toHaveProperty('createdAt');
  expect(responseBody).toHaveProperty('updatedAt');
  expect(responseBody).not.toHaveProperty('password');
}

export function expectValidationError(responseBody: any) {
  expect(responseBody).toHaveProperty('message');
  expect(responseBody).toHaveProperty('statusCode');
  expect(responseBody.statusCode).toBe(400);
}