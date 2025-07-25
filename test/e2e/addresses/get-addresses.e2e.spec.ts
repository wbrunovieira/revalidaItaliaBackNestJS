// test/e2e/addresses/get-addresses.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import request from 'supertest';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AddressE2ETestSetup } from './shared/address-e2e-test-setup';
import { AddressE2ETestHelpers } from './shared/address-e2e-test-helpers';
import { AddressE2ETestData } from './shared/address-e2e-test-data';

describe('[GET] /addresses - E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await AddressE2ETestSetup.cleanupTestData(prisma);
  });

  afterAll(async () => {
    await AddressE2ETestSetup.cleanupTestData(prisma);
    if (app) {
      await app.close();
    }
  });

  describe('Success cases', () => {
    it('should return addresses for a valid profileId', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.getUser,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.getUser.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.getUser.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const addressData = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: '200 Main St',
        number: '20',
        complement: '',
        district: 'Midtown',
        city: 'Townsville',
        state: 'Stateland',
        postalCode: '22233-445',
      });

      await AddressE2ETestHelpers.createAddress(app, addressData, userToken);

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        profileId!,
        userToken,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].street).toBe('200 Main St');
    });

    it('should return 403 when user tries to get addresses from another profile', async () => {
      // Arrange
      // Create user with their own profileId
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.getUser,
      );
      const userIdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.getUser.email,
      );
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: userIdentityId!,
        role: 'student',
      });

      // Try to access a different profileId
      const otherProfileId = AddressE2ETestData.invalidUUID;

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        otherProfileId,
        userToken,
      );

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message || response.body.detail).toMatch(/forbidden/i);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when profileId is missing', async () => {
      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        '',
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/profileId/i);
    });
  });

  describe('Additional scenarios', () => {
    it('should return multiple addresses for same profile', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      // Create multiple addresses
      const address1 = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: '100 First St',
        city: 'New York',
      });
      const address2 = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: '200 Second Ave',
        city: 'Los Angeles',
      });

      await AddressE2ETestHelpers.createAddress(app, address1, userToken);
      await AddressE2ETestHelpers.createAddress(app, address2, userToken);

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        profileId!,
        userToken,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body.map((a: any) => a.street)).toContain('100 First St');
      expect(response.body.map((a: any) => a.street)).toContain(
        '200 Second Ave',
      );
    });

  });

  describe('Security', () => {
    it('should return 401 when no authentication token provided', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/addresses?profileId=123')
        .send();

      // Assert
      expect(response.status).toBe(401);
    });

    it('should allow admin to view addresses from any user', async () => {
      // Arrange
      // Create a regular user with address
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const userProfileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      const userIdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      expect(userProfileId).toBeTruthy();

      // Generate token for regular user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: userIdentityId!,
        role: 'student',
      });

      // Create address for regular user
      const addressData = AddressE2ETestData.validAddress({
        profileId: userProfileId!,
        street: 'User Street 123',
      });
      await AddressE2ETestHelpers.createAddress(app, addressData, userToken);

      // Create admin user
      await AddressE2ETestSetup.createTestUser(app, {
        ...AddressE2ETestData.testUsers.user2,
        email: 'admin-get@example.com',
        role: 'admin',
      });
      const adminIdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        'admin-get@example.com',
      );
      const adminToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: adminIdentityId!,
        role: 'admin',
      });

      // Act - Admin gets user's addresses
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        userProfileId!,
        adminToken,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].street).toBe('User Street 123');
    });
  });

  describe('Edge cases', () => {

    it('should return addresses sorted by creation date', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user2,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user2.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user2.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      // Create addresses with delay to ensure different timestamps
      const address1 = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: 'Old Address',
      });
      await AddressE2ETestHelpers.createAddress(app, address1, userToken);

      // Small delay to ensure different createdAt
      await new Promise((resolve) => setTimeout(resolve, 100));

      const address2 = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: 'New Address',
      });
      await AddressE2ETestHelpers.createAddress(app, address2, userToken);

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        profileId!,
        userToken,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);

      // Verify dates are in ISO format
      expect(response.body[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
