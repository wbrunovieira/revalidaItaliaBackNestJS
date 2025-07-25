// test/e2e/profile/patch-profile.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { JwtService } from '@nestjs/jwt';
import {
  createTestUser,
  cleanupTestUsers,
  findUserByEmail,
} from './shared/profile-e2e-test-setup';
import {
  generateValidJwtToken,
  expectValidProfileResponse,
  expectValidationError,
} from './shared/profile-e2e-test-helpers';
import {
  testEmails,
  testUserIds,
  createMainTestUser,
  createOtherTestUser,
  createValidUpdateData,
  createPartialUpdateData,
  createInvalidEmailData,
  createInvalidCPFData,
  createShortNameData,
  createInvalidProfileImageData,
  createDuplicateEmailData,
  createDuplicateCPFData,
} from './shared/profile-e2e-test-data';

describe('PATCH /profile - E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let validUserToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    // Run migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Create application
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Clean up any existing test data
    await cleanupTestUsers(prisma, testEmails);

    // Create test users
    const mainUser = await createTestUser(prisma, createMainTestUser());
    const otherUser = await createTestUser(prisma, createOtherTestUser());

    // Generate real JWT tokens that will be properly decoded by E2ETestModule
    const validUserPayload = { sub: mainUser.id, role: mainUser.authorization?.role || 'student' };
    const otherUserPayload = { sub: otherUser.id, role: otherUser.authorization?.role || 'student' };

    // Create properly formatted JWT tokens
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');
    const validPayloadEncoded = Buffer.from(
      JSON.stringify(validUserPayload),
    ).toString('base64url');
    const otherPayloadEncoded = Buffer.from(
      JSON.stringify(otherUserPayload),
    ).toString('base64url');

    validUserToken = `${header}.${validPayloadEncoded}.fake-signature`;
    otherUserToken = `${header}.${otherPayloadEncoded}.fake-signature`;
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestUsers(prisma, testEmails);
    await app.close();
  });

  describe('Success cases', () => {
    it('should update user profile with all fields', async () => {
      // Arrange
      const updateData = createValidUpdateData();
      console.log('Valid user token:', validUserToken);
      console.log('Update data:', updateData);

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData);

      // Debug response
      if (response.status !== 200) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(200);

      // Assert
      expectValidProfileResponse(response.body);
      expect(response.body.profile.fullName).toBe(updateData.fullName);
      expect(response.body.identity.email).toBe(updateData.email);
      expect(response.body.profile.nationalId).toBe(updateData.nationalId);
      expect(response.body.profile.phone).toBe(updateData.phone);
      expect(response.body.profile.profileImageUrl).toBe(updateData.profileImageUrl);

      // Verify in database
      const updatedUser = await findUserByEmail(prisma, updateData.email);
      expect(updatedUser).toBeTruthy();
      expect(updatedUser?.profile?.fullName).toBe(updateData.fullName);
      expect(updatedUser?.profile?.nationalId).toBe(updateData.nationalId);
    });

    it('should update user profile with partial fields', async () => {
      // Arrange
      const partialData = createPartialUpdateData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(partialData)
        .expect(200);

      // Assert
      expectValidProfileResponse(response.body);
      expect(response.body.profile.fullName).toBe(partialData.fullName);
      expect(response.body.profile.phone).toBe(partialData.phone);
      // Email should remain unchanged
      expect(response.body.identity.email).toBe(testEmails[1]);
    });

    it('should accept valid profile image URLs', async () => {
      const validUrls = [
        'https://example.com/profile.jpg',
        'http://example.com/avatar.png',
        '/images/user-profile.jpg',
        '/static/avatars/default.png',
      ];

      for (const profileImageUrl of validUrls) {
        const response = await request(app.getHttpServer())
          .patch('/profile')
          .set('Authorization', `Bearer ${validUserToken}`)
          .send({ profileImageUrl })
          .expect(200);

        expect(response.body.profile.profileImageUrl).toBe(profileImageUrl);
      }
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when email format is invalid', async () => {
      // Arrange
      const invalidData = createInvalidEmailData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expectValidationError(response.body);
      expect(response.body.detail).toContain('Invalid email format');
    });

    it('should return 400 when CPF format is invalid', async () => {
      // Arrange
      const invalidData = createInvalidCPFData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expectValidationError(response.body);
      expect(response.body.detail).toContain(
        'nationalId must be at least 3 characters long',
      );
    });

    it('should return 400 when name is too short', async () => {
      // Arrange
      const invalidData = createShortNameData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expectValidationError(response.body);
      expect(response.body.detail).toContain(
        'Full name must be at least 3 characters long',
      );
    });

    it('should return 400 when profile image URL is invalid', async () => {
      // Arrange
      const invalidData = createInvalidProfileImageData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expectValidationError(response.body);
      // Check for URL validation message
      const errorMessage = Array.isArray(response.body.detail)
        ? response.body.detail.join(' ')
        : response.body.detail;
      expect(errorMessage).toContain('must be a valid URL');
    });

    it('should return 400 when no fields are provided', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.detail).toBe(
        'At least one field must be provided for update',
      );
    });
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when no token is provided', async () => {
      // Arrange
      const updateData = createPartialUpdateData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body.detail).toBe('Unauthorized');
    });

    it('should return 401 when invalid token is provided', async () => {
      // Arrange
      const updateData = createPartialUpdateData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body.detail).toBe('Unauthorized');
    });

    it('should return 401 when malformed authorization header', async () => {
      // Arrange
      const updateData = createPartialUpdateData();

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', 'NotBearer token')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body.detail).toBe('Unauthorized');
    });
  });

  describe('Business rules', () => {
    it('should return 409 when email is already in use by another user', async () => {
      // Arrange - Create another user for duplicate testing
      await createTestUser(prisma, {
        fullName: 'Duplicate Email User',
        email: testEmails[2],
        password: 'Test123!@#',
        nationalId: '22222222222',
        role: 'student',
      });

      const duplicateData = {
        email: testEmails[2], // Try to use another user's email
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(duplicateData)
        .expect(409);

      // Assert
      expect(response.body.detail).toBe('Email already in use');
    });

    it('should return 409 when CPF is already in use by another user', async () => {
      // Arrange - Create another user for duplicate testing
      await createTestUser(prisma, {
        fullName: 'Duplicate CPF User',
        email: testEmails[3],
        password: 'Test123!@#',
        nationalId: '33333333333',
        role: 'student',
      });

      const duplicateData = {
        nationalId: '33333333333', // Try to use another user's nationalId
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(duplicateData)
        .expect(409);

      // Assert
      expect(response.body.detail).toBe('National ID already in use');
    });

    it('should allow user to keep their own email when updating other fields', async () => {
      // Arrange
      const currentUser = await prisma.userIdentity.findUnique({
        where: { id: testUserIds.mainUser },
        include: {
          profile: true,
          authorization: true,
        },
      });
      const updateData = {
        email: currentUser?.email, // Same email
        fullName: 'Name Changed But Same Email',
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.identity.email).toBe(currentUser?.email);
      expect(response.body.profile.fullName).toBe(updateData.fullName);
    });

    it('should allow user to keep their own CPF when updating other fields', async () => {
      // Arrange
      const currentUser = await prisma.userIdentity.findUnique({
        where: { id: testUserIds.mainUser },
        include: {
          profile: true,
          authorization: true,
        },
      });
      const updateData = {
        nationalId: currentUser?.profile?.nationalId, // Same nationalId
        fullName: 'Name Changed But Same CPF',
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.profile.nationalId).toBe(currentUser?.profile?.nationalId);
      expect(response.body.profile.fullName).toBe(updateData.fullName);
    });
  });

  describe('Edge cases', () => {
    it('should handle birth date correctly', async () => {
      // Arrange
      const birthDate = '2000-12-25';
      const updateData = {
        birthDate,
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.profile.birthDate).toBeDefined();
      const responseBirthDate = new Date(response.body.profile.birthDate);
      const expectedDate = new Date(birthDate);
      expect(responseBirthDate.toISOString().split('T')[0]).toBe(
        expectedDate.toISOString().split('T')[0],
      );
    });

    it('should handle special characters in name', async () => {
      // Arrange
      const specialNames = [
        "João D'Arc",
        'María José',
        'Jean-Pierre',
        'Anne-Marie',
        'José Carlos',
      ];

      for (const name of specialNames) {
        // Act
        const response = await request(app.getHttpServer())
          .patch('/profile')
          .set('Authorization', `Bearer ${validUserToken}`)
          .send({ fullName: name })
          .expect(200);

        // Assert
        expect(response.body.profile.fullName).toBe(name);
      }
    });

    it('should handle international phone numbers', async () => {
      // Arrange
      const phoneNumbers = [
        '+1234567890',
        '+55 11 99999-9999',
        '+44 20 7123 4567',
        '+33 1 42 86 82 00',
      ];

      for (const phone of phoneNumbers) {
        // Act
        const response = await request(app.getHttpServer())
          .patch('/profile')
          .set('Authorization', `Bearer ${validUserToken}`)
          .send({ phone })
          .expect(200);

        // Assert
        expect(response.body.profile.phone).toBe(phone);
      }
    });

    it('should not update role through profile endpoint', async () => {
      // Arrange
      const updateData = {
        fullName: 'Test Role Update',
        role: 'admin', // Try to escalate privileges
      };

      // Act - Should reject due to forbidNonWhitelisted
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData)
        .expect(400);

      // Assert - Should reject unknown property
      expect(response.body.detail).toContain('property role should not exist');
    });
  });
});
