// test/e2e/test-helpers/e2e-test-module.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/infra/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/infra/auth/guards/roles.guard';
import { JwtStrategy } from '../../../src/infra/auth/strategies/jwt.strategy';
import { HttpExceptionFilter } from '../../../src/infra/filters/http-exception.filter';
import { LoggingInterceptor } from '../../../src/infra/interceptors/logging.interceptor';

export class E2ETestModule {
  static async create(moduleImports: any[]): Promise<{
    app: INestApplication;
    moduleRef: TestingModule;
  }> {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JDcds4meW8hfaF3PhSVP3wG6gxPEYdVV5EiNsVDmCh
gweHg1lCrNgMPd0YFe82KwO66vC0IZhZ7VfB0xV2Wwfb/4Wto7C7pV8lQjBHxwHo
W8w7eL7gwAIRJiLlafqPf4qhkJrP8rMYj9RgSbUsdCCYfKLI6qHiU4km3OTXzVOE
DPvkUXxom8Y+GkwFm9jF0xwqNeTm/XJyJJnSrPmLQN7k5ePXO2++HHGLUXo7iT7J
NUoD3YzGsXFjy0TJQgS7NhCGD0or0Y0EYs2vBnwlqCmpCRQlwY3lg3Og3a92dTQo
M4NCJEoQjvBJxPHxGR2vYPCqBx8nGhpvNGePvwIDAQABAoIBAElNcMillfnR72F1
Sz3/BQNX3HPFTliWQu5miTnTW0L6UVQN7nCudLOmVyiXKoKNZDGJ4LTKXG3F6fMb
XaOjpRCp3m4H5KvmzwwdIp6lNgJoYIy3cOYPAKdP3hxHT3IJHYXjdmvDJh2cTxUr
9rW8AK3UBvCGEMLtbP5uYmuLxjQy5lSU+Nvwqxph8V/4j8hYN9RP1Y5bBPFQpUKe
DiMJ3VMOd0LxQR4UQ8ROx8Bs9YMkHHGxxNrF2xDZT3haYisUJNPKBcKb2sd0Vb9L
kR05KGL7YXLQVJT5XxGQ72D9KNxNk8W7wLNFwRedN9wLSNqGyTp/bXEXDU6qx/vZ
+1rPmlECgYEA78E0++H+NFOCMqHPjECMvbrI+G7gNQlFl0Bk5oH8/AUqRwYi49qJ
bjKUqQNjZEQK8T8OZTvWZv8+1QB8Q+gVuPQU4W6wLqLWD3RaSYBQQxNcU/tTXHLg
C0hoK9p6cFHQj6xNUQgIICEK5e7wnBvEW9du+1kU7ri1gTKb6xvzNdMCgYEA4A6x
iP5TtE1F9k+kqNvmMm6J1cqPa7TY0RT6aVZkuFZaKPVXBnmsC8045kNaquoCpLXE
wyH6TbfvBX4yKvmgR1L7D6dAbAg9HIvo+6DDxBBG3x1S+lrGmCXPKKYd+ka4D5aH
1WFXVLCzB5rEVTrv6+FtvFXpK2IKwWt50PNRnXUCgYEAxIZP1qTi+Lq0tf1uTqHz
W1kZVMZQs7xNmVsVQ7cVdrC/2fbtLV5cZPtHI3S1FX7dFQu7c/bQ4wCDzzld9vLx
LyJ3tXGU6yBrJztaH0QrKvgYnRdMNT6SQbLCXsSXqALBczNTs8c2JCdKKvGDNo5G
rEhurj1x1ahfBBLNmyKPTl0CgYB3YXQjYrRVEKTIuqc8dFpztpHVOCR0hkNhLZDR
tI48IFXpBPW5qnSHvlQw5IbIECTBpwYiHEMr5dRgMVmgJumwSBEAOf5fvc5kJ3NG
y3XfEWmVd5T3GXnzFME3i/jSfv8jqhp7HZBkN0u1wc6pL9YmAMpMSRIQ1f0cqxdH
EJ7zBQKBgG5Vc+NFcEM7EG9k0XPLqtLYhsHUa0Z8W5v3j+RuPX8J6LZmWZ3gNJtU
4tM2RwXCqNQoqPmFmnJOr9qHbCqE8BtbCXRbHNNBS0LVo3wXpDgeVjcgaQcNkHcy
-----END RSA PRIVATE KEY-----`;
    process.env.JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JDcds4meW8hfaF
3PhSVP3wG6gxPEYdVV5EiNsVDmChgweHg1lCrNgMPd0YFe82KwO66vC0IZhZ7VfB
0xV2Wwfb/4Wto7C7pV8lQjBHxwHoW8w7eL7gwAIRJiLlafqPf4qhkJrP8rMYj9Rg
SbUsdCCYfKLI6qHiU4km3OTXzVOEDPvkUXxom8Y+GkwFm9jF0xwqNeTm/XJyJJnS
rPmLQN7k5ePXO2++HHGLUXo7iT7JNUoD3YzGsXFjy0TJQgS7NhCGD0or0Y0EYs2v
BnwlqCmpCRQlwY3lg3Og3a92dTQoM4NCJEoQjvBJxPHxGR2vYPCqBx8nGhpvNGeP
vwIDAQAB
-----END PUBLIC KEY-----`;

    const moduleRef = await Test.createTestingModule({
      imports: moduleImports,
    })
      .overrideProvider(JwtStrategy)
      .useValue({
        validate: async (payload: any) => ({
          sub: payload.sub || 'test-user-id',
          role: payload.role || 'admin',
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          // No auth header = 401 Unauthorized
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Unauthorized');
          }

          const token = authHeader.substring(7);
          // Invalid tokens = 401 Unauthorized
          const invalidTokens = ['invalid-token', 'invalid-token-here'];
          if (invalidTokens.includes(token) || token.length <= 5) {
            throw new UnauthorizedException('Unauthorized');
          }

          // Decode token and set user on request (like Passport would do)
          try {
            // Handle special test tokens with predefined roles
            if (token === 'test-jwt-token') {
              // Default test token is admin role for backward compatibility
              request.user = {
                sub: 'test-admin-user-id',
                role: 'admin',
              };
            } else if (token === 'test-jwt-student-token') {
              request.user = {
                sub: 'test-student-user-id',
                role: 'student',
              };
            } else {
              // Try to decode as proper JWT
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(
                  Buffer.from(parts[1], 'base64url').toString(),
                );
                request.user = {
                  sub: payload.sub || 'test-user-id',
                  role: payload.role || 'student',
                  ...payload,
                };
              } else {
                // Fallback for non-JWT tokens
                request.user = {
                  sub: 'test-user-id',
                  role: 'student',
                };
              }
            }
          } catch (error) {
            throw new UnauthorizedException('Unauthorized');
          }

          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          const user = request.user;

          // If no user, return false (403 Forbidden)
          if (!user) {
            return false;
          }

          // For testing, determine if this is an admin-only endpoint
          // Based on the request URL and method
          const url = request.url;
          const method = request.method;

          // Admin-only endpoints (based on the @Roles('admin') decorator in controllers)
          const adminOnlyEndpoints = [
            'GET /students',
            'GET /students/search',
            'DELETE /students/', // includes any DELETE with ID
          ];

          const currentEndpoint = `${method} ${url.split('?')[0]}`; // Remove query params
          const isAdminOnly = adminOnlyEndpoints.some((endpoint) => {
            if (endpoint.endsWith('/')) {
              // For endpoints like 'DELETE /students/', check if URL starts with it
              return currentEndpoint.startsWith(endpoint);
            }
            return currentEndpoint === endpoint;
          });

          // If admin-only endpoint, check if user is admin
          if (isAdminOnly) {
            const userRole = user.role || 'student';
            return userRole === 'admin';
          }

          // For non-admin endpoints, allow any authenticated user
          return true;
        },
      })
      .overrideProvider('VideoHostProvider')
      .useValue({
        getMetadata: async (videoId: string) => ({
          durationInSeconds: 123,
        }),
        getEmbedUrl: (videoId: string) =>
          `https://example.com/embed/${videoId}`,
      })
      .overrideProvider(JwtService)
      .useValue({
        sign: (payload: any) => {
          // Generate a fake JWT token for testing
          const header = Buffer.from(
            JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
          ).toString('base64url');
          const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString(
            'base64url',
          );
          return `${header}.${payloadEncoded}.fake-signature`;
        },
        verify: (token: string) => {
          // For testing, just decode the payload without verification
          const parts = token.split('.');
          if (parts.length !== 3) throw new Error('Invalid token');
          return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        },
      })
      .compile();

    const app = moduleRef.createNestApplication();

    // Register global interceptors
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Register global filters
    app.useGlobalFilters(new HttpExceptionFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    return { app, moduleRef };
  }
}
