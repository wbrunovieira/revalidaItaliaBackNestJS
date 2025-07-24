// src/infra/controllers/tests/profile/patch-profile.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { createProfileControllerTestSetup } from './shared/profile-controller-test-setup';
import {
  createValidUpdateProfileData,
  createPartialUpdateProfileData,
  createInvalidEmailData,
  createInvalidCPFData,
  createShortNameData,
  createInvalidProfileImageUrlData,
  createEmptyUpdateData,
  createUserPayload,
} from './shared/profile-controller-test-data';
import {
  createSuccessResponse,
  createInvalidInputError,
  createDuplicateEmailError,
  createDuplicateNationalIdError,
  createResourceNotFoundError,
  createGenericError,
} from './shared/profile-controller-test-helpers';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';

describe('PATCH ProfileController', () => {
  let app: INestApplication;
  let mockUpdateUserProfileUseCase: any;
  let authToken: string;

  beforeEach(async () => {
    const { testingModule, mockUpdateUserProfileUseCase: mockUseCase } =
      await createProfileControllerTestSetup();

    mockUpdateUserProfileUseCase = mockUseCase;

    app = testingModule.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authToken = 'Bearer mock-jwt-token';
  });

  it('should update user profile successfully with all fields', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    const expectedUser = {
      id: 'test-user-id',
      ...validData,
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createSuccessResponse(expectedUser),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: 'test-user-id',
      name: validData.name,
      email: validData.email,
      cpf: validData.nationalId,
      phone: validData.phone,
      profileImageUrl: validData.profileImageUrl,
      role: 'student',
    });

    expect(mockUpdateUserProfileUseCase.execute).toHaveBeenCalledWith({
      identityId: 'test-user-id',
      name: validData.name,
      email: validData.email,
      nationalId: validData.nationalId,
      phone: validData.phone,
      birthDate: validData.birthDate,
      profileImageUrl: validData.profileImageUrl,
    });
  });

  it('should update user profile with partial fields', async () => {
    // Arrange
    const partialData = createPartialUpdateProfileData();
    const expectedUser = {
      id: 'test-user-id',
      name: partialData.name,
      email: 'existing@example.com',
      cpf: '11111111111',
      phone: partialData.phone,
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createSuccessResponse(expectedUser),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(partialData)
      .expect(200);

    expect(response.body.user.name).toBe(partialData.name);
    expect(response.body.user.phone).toBe(partialData.phone);
  });

  it('should return 400 when email format is invalid', async () => {
    // Arrange
    const invalidData = createInvalidEmailData();

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain('Invalid email format');
  });

  it('should return 400 when CPF format is invalid', async () => {
    // Arrange
    const invalidData = createInvalidCPFData();

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain('nationalId must be at least 3 characters long');
  });

  it('should return 400 when name is too short', async () => {
    // Arrange
    const invalidData = createShortNameData();

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toContain(
      'Name must be at least 3 characters long',
    );
  });

  it('should return 400 when profile image URL is invalid', async () => {
    // Arrange
    const invalidData = createInvalidProfileImageUrlData();

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toBeDefined();
    // Check if it's an array of error messages
    const errorMessages = Array.isArray(response.body.message)
      ? response.body.message.join(' ')
      : response.body.message;
    expect(errorMessages).toContain('valid URL');
  });

  it('should handle use case validation errors', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createInvalidInputError('At least one field must be provided', []),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(400);

    expect(response.body.message).toBe('At least one field must be provided');
  });

  it('should return 409 when email is already in use', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createDuplicateEmailError(),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(409);

    expect(response.body.message).toBe('Email already in use');
  });

  it('should return 409 when CPF is already in use', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createDuplicateNationalIdError(),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(409);

    expect(response.body.message).toBe('National ID already in use');
  });

  it('should return 400 when user is not found', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createResourceNotFoundError('User not found'),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(400);

    expect(response.body.message).toBe('User not found');
  });

  it('should return 500 when an unexpected error occurs', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();
    mockUpdateUserProfileUseCase.execute.mockResolvedValue(
      createGenericError('Database connection failed'),
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', authToken)
      .send(validData)
      .expect(500);

    expect(response.body.message).toBe('Failed to update profile');
  });

  it('should return 401 when no authorization token is provided', async () => {
    // Arrange
    const validData = createValidUpdateProfileData();

    // Act & Assert
    await request(app.getHttpServer())
      .patch('/profile')
      .send(validData)
      .expect(401);
  });

  it('should accept valid profile image URLs', async () => {
    // Arrange
    const validUrls = [
      'https://example.com/image.jpg',
      'http://example.com/image.png',
      '/images/profile.jpg',
      '/static/avatars/user.png',
    ];

    for (const profileImageUrl of validUrls) {
      const data = { profileImageUrl };
      const expectedUser = {
        id: 'test-user-id',
        profileImageUrl,
        name: 'Test User',
        email: 'test@example.com',
        cpf: '12345678901',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpdateUserProfileUseCase.execute.mockResolvedValue(
        createSuccessResponse(expectedUser),
      );

      // Act & Assert
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', authToken)
        .send(data)
        .expect(200);

      expect(response.body.user.profileImageUrl).toBe(profileImageUrl);
    }
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
