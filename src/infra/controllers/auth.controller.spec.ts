// src/infra/controllers/auth.controller.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authentication/authenticate-user.use-case';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/auth/domain/exceptions/user-not-found.exception';
import { AuthenticationError } from '@/domain/auth/domain/exceptions/authentication-error.exception';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { left, right } from '@/core/either';
import { AuthenticateUserRequestDto } from '@/domain/auth/application/dtos/authenticate-user-request.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authenticateUserUseCase: { execute: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn> };

  // Helper function to create a mock request
  function createMockRequest(userAgent: string = 'Mozilla/5.0') {
    return {
      headers: {
        'user-agent': userAgent,
      },
    } as any;
  }

  // Helper function to create a valid DTO
  function createValidDto(): AuthenticateUserRequestDto {
    return {
      email: 'john@example.com',
      password: 'SecurePass123!',
    };
  }

  // Helper function to create a mock user response
  function createMockUser() {
    return {
      id: 'user-123',
      identityId: 'identity-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      cpf: '12345678900',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  beforeEach(() => {
    authenticateUserUseCase = { execute: vi.fn() };
    jwtService = { sign: vi.fn() };

    controller = new AuthController(
      authenticateUserUseCase as any,
      jwtService as any,
    );
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should authenticate user successfully with valid credentials', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken = 'jwt.token.here';
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await controller.login(dto, ipAddress, request);

      // Assert
      expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        ipAddress,
        userAgent: 'Mozilla/5.0',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.identityId,
        role: mockUser.role,
      });
      expect(result).toEqual({
        accessToken: mockToken,
        user: mockUser,
      });
    });

    it('should handle request without user-agent header', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken = 'jwt.token.here';
      const ipAddress = '192.168.1.1';
      const request = { headers: {} } as any;

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await controller.login(dto, ipAddress, request);

      // Assert
      expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        ipAddress,
        userAgent: 'Unknown',
      });
      expect(result.accessToken).toBe(mockToken);
    });

    it('should authenticate admin user successfully', async () => {
      // Arrange
      const dto = {
        email: 'admin@revalidaitalia.com',
        password: 'AdminSecure456!',
      };
      const mockAdmin = {
        ...createMockUser(),
        email: 'admin@revalidaitalia.com',
        role: 'admin',
      };
      const mockToken = 'admin.jwt.token';
      const ipAddress = '10.0.0.1';
      const request = createMockRequest('Admin Browser');

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockAdmin }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await controller.login(dto, ipAddress, request);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockAdmin.identityId,
        role: 'admin',
      });
      expect(result).toEqual({
        accessToken: mockToken,
        user: mockAdmin,
      });
    });
  });

  // Authentication Failures
  describe('Authentication Failures', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(new AuthenticationError()),
      );

      // Act & Assert
      await expect(controller.login(dto, ipAddress, request)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        controller.login(dto, ipAddress, request),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(new UserNotFoundError()),
      );

      // Act & Assert
      await expect(controller.login(dto, ipAddress, request)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        controller.login(dto, ipAddress, request),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    });

    it('should throw UnauthorizedException for validation errors', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(
          new InvalidInputError('Validation failed', [
            {
              path: ['password'],
              message: 'Password too short',
              code: 'too_small',
            },
          ]),
        ),
      );

      // Act & Assert
      await expect(controller.login(dto, ipAddress, request)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        controller.login(dto, ipAddress, request),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    });

    it('should throw UnauthorizedException for repository errors', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(new RepositoryError('Database connection failed')),
      );

      // Act & Assert
      await expect(controller.login(dto, ipAddress, request)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        controller.login(dto, ipAddress, request),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle different user agents correctly', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken = 'jwt.token.here';
      const ipAddress = '192.168.1.1';
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'PostmanRuntime/7.28.4',
        'curl/7.68.0',
      ];

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act & Assert
      for (const userAgent of userAgents) {
        const request = createMockRequest(userAgent);
        const result = await controller.login(dto, ipAddress, request);

        expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
          email: dto.email,
          password: dto.password,
          ipAddress,
          userAgent,
        });
        expect(result.accessToken).toBe(mockToken);
      }
    });

    it('should handle different IP addresses correctly', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken = 'jwt.token.here';
      const request = createMockRequest();
      const ipAddresses = [
        '192.168.1.1',
        '10.0.0.1',
        '::1',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      ];

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act & Assert
      for (const ipAddress of ipAddresses) {
        const result = await controller.login(dto, ipAddress, request);

        expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
          email: dto.email,
          password: dto.password,
          ipAddress,
          userAgent: 'Mozilla/5.0',
        });
        expect(result.accessToken).toBe(mockToken);
      }
    });

    it('should handle empty request headers object', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken = 'jwt.token.here';
      const ipAddress = '192.168.1.1';
      const request = { headers: undefined } as any; // Undefined headers property

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await controller.login(dto, ipAddress, request);

      // Assert
      expect(authenticateUserUseCase.execute).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        ipAddress,
        userAgent: 'Unknown',
      });
      expect(result.accessToken).toBe(mockToken);
    });
  });

  // JWT Token Generation
  describe('JWT Token Generation', () => {
    it('should generate token with correct payload for student', async () => {
      // Arrange
      const dto = createValidDto();
      const mockStudent = {
        ...createMockUser(),
        role: 'student',
      };
      const mockToken = 'student.jwt.token';
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockStudent }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      await controller.login(dto, ipAddress, request);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockStudent.identityId,
        role: 'student',
      });
    });

    it('should generate token with correct payload for admin', async () => {
      // Arrange
      const dto = createValidDto();
      const mockAdmin = {
        ...createMockUser(),
        role: 'admin',
      };
      const mockToken = 'admin.jwt.token';
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockAdmin }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      await controller.login(dto, ipAddress, request);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockAdmin.identityId,
        role: 'admin',
      });
    });

    it('should return JWT token in expected format', async () => {
      // Arrange
      const dto = createValidDto();
      const mockUser = createMockUser();
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        right({ user: mockUser }),
      );
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await controller.login(dto, ipAddress, request);

      // Assert
      expect(result.accessToken).toBe(mockToken);
      expect(result.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });
  });

  // Security and Error Handling
  describe('Security and Error Handling', () => {
    it('should always return generic error message for all authentication failures', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      const errors = [
        new AuthenticationError(),
        new UserNotFoundError(),
        new InvalidInputError('Validation failed', []),
        new RepositoryError('Database error'),
        new Error('Unexpected error'),
      ];

      // Act & Assert
      for (const error of errors) {
        authenticateUserUseCase.execute.mockResolvedValue(left(error));

        await expect(
          controller.login(dto, ipAddress, request),
        ).rejects.toMatchObject({
          message: 'Invalid credentials',
        });
      }
    });

    it('should not expose internal error details', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(
          new RepositoryError(
            'Connection to database failed on host 192.168.1.100:5432',
          ),
        ),
      );

      // Act & Assert
      try {
        await controller.login(dto, ipAddress, request);
      } catch (error: any) {
        expect(error.message).toBe('Invalid credentials');
        expect(error.message).not.toContain('192.168.1.100');
        expect(error.message).not.toContain('5432');
        expect(error.message).not.toContain('database');
      }
    });

    it('should not expose validation details', async () => {
      // Arrange
      const dto = createValidDto();
      const ipAddress = '192.168.1.1';
      const request = createMockRequest();

      authenticateUserUseCase.execute.mockResolvedValue(
        left(
          new InvalidInputError('Validation failed', [
            {
              path: ['email'],
              message: 'Invalid email format',
              code: 'invalid_string',
            },
            {
              path: ['password'],
              message: 'Password must be at least 6 characters',
              code: 'too_small',
            },
          ]),
        ),
      );

      // Act & Assert
      try {
        await controller.login(dto, ipAddress, request);
      } catch (error: any) {
        expect(error.message).toBe('Invalid credentials');
        expect(error.message).not.toContain('email');
        expect(error.message).not.toContain('password');
        expect(error.message).not.toContain('6 characters');
      }
    });
  });
});
