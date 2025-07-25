// test/e2e/addresses/patch-addresses-id.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import request from 'supertest';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AddressE2ETestSetup } from './shared/address-e2e-test-setup';
import { AddressE2ETestHelpers } from './shared/address-e2e-test-helpers';
import { AddressE2ETestData } from './shared/address-e2e-test-data';

describe('[PATCH] /addresses/:id - E2E', () => {
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
    it('should update address fields successfully', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.patchUser,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.patchUser.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.patchUser.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const initialAddress = AddressE2ETestData.validAddress({
        profileId: profileId!,
        street: '300 Oak St',
        number: '30',
        complement: 'Apt 1',
        district: 'Uptown',
        city: 'Cityplace',
        state: 'Statezone',
        postalCode: '33344-556',
      });

      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        initialAddress,
        userToken,
      );
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Act
      const updateData = {
        street: '301 Oak St',
        number: '31',
      };
      const updateRes = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        updateData,
        userToken,
      );

      // Assert
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.street).toBe('301 Oak St');
      expect(updateRes.body.number).toBe('31');
      // Other fields should remain unchanged
      expect(updateRes.body.city).toBe(initialAddress.city);
      expect(updateRes.body.postalCode).toBe(initialAddress.postalCode);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when no fields provided for update', async () => {
      // Arrange - Create a user with an address
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
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      // Create an address first
      const addressData = AddressE2ETestData.validAddress({
        profileId: profileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );
      const addressId = createRes.body.addressId;

      // Act - Try to update with empty object
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        {},
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail || response.body.message).toMatch(/at least one field/i);
    });
  });

  describe('Business rules', () => {
    it('should return 404 when address not found', async () => {
      // Arrange - Create a user to get a valid token
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      // Act
      const updateData = { street: 'New Street' };
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        AddressE2ETestData.invalidUUID,
        updateData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message || response.body.detail).toMatch(/not found/i);
    });

    it('should return 400 when fields exceed maximum length', async () => {
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

      const initialAddress = AddressE2ETestData.validAddress({
        profileId: profileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        initialAddress,
        userToken,
      );
      const addressId = createRes.body.addressId;

      // Act
      const updateData = {
        street: 'A'.repeat(256), // Exceeds 255 character limit
      };
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        updateData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail || response.body.message).toMatch(/street.*length|too long/i);
    });

    it('should successfully update multiple fields at once', async () => {
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

      const initialAddress = AddressE2ETestData.validAddress({
        profileId: profileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        initialAddress,
        userToken,
      );
      const addressId = createRes.body.addressId;

      // Act
      const updateData = {
        street: 'Updated Street',
        number: '999',
        city: 'Updated City',
        postalCode: '99999-999',
      };
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        updateData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.street).toBe('Updated Street');
      expect(response.body.number).toBe('999');
      expect(response.body.city).toBe('Updated City');
      expect(response.body.postalCode).toBe('99999-999');
      // Other fields should remain unchanged
      expect(response.body.country).toBe(initialAddress.country);
    });
  });

  describe('Security', () => {
    it('should return 401 when no authentication token provided', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .patch('/addresses/123')
        .send({ street: 'New Street' });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 when user tries to update address of another user', async () => {
      // Arrange
      // Create user1 with address
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const user1ProfileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      const user1IdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      expect(user1ProfileId).toBeTruthy();
      expect(user1IdentityId).toBeTruthy();

      // Generate JWT token for user1
      const user1Token = await AddressE2ETestSetup.generateJwtToken({
        identityId: user1IdentityId!,
        role: 'student',
      });

      // Create address for user1
      const addressData = AddressE2ETestData.validAddress({
        profileId: user1ProfileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(app, addressData, user1Token);
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Create user2
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user2,
      );
      const user2IdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user2.email,
      );
      const user2Token = await AddressE2ETestSetup.generateJwtToken({
        identityId: user2IdentityId!,
        role: 'student',
      });

      // Act - User2 tries to update User1's address
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        { street: 'Hacked Street' },
        user2Token,
      );

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message || response.body.detail).toMatch(/forbidden/i);

      // Verify address was not updated
      const unchangedAddress = await prisma.address.findUnique({
        where: { id: addressId },
      });
      expect(unchangedAddress?.street).not.toBe('Hacked Street');
    });

    it('should return 400 when invalid UUID format', async () => {
      // Arrange - Create a user to get a valid token
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      // Act
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        'invalid-uuid',
        { street: 'New Street' },
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/uuid/i);
    });

    it('should sanitize input values', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.securityUser,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.securityUser.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.securityUser.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const initialAddress = AddressE2ETestData.validAddress({
        profileId: profileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        initialAddress,
        userToken,
      );
      const addressId = createRes.body.addressId;

      // Act
      const updateData = {
        street: "'; DROP TABLE addresses; --",
        city: "<script>alert('xss')</script>",
      };
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        addressId,
        updateData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(200);
      // Verify the data was properly sanitized/escaped
      const updatedAddress = await prisma.address.findUnique({
        where: { id: addressId },
      });
      expect(updatedAddress?.street).toBe("'; DROP TABLE addresses; --");
      expect(updatedAddress?.city).toBe("<script>alert('xss')</script>");
    });
  });
});
