// test/e2e/addresses/delete-addresses-id.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import request from 'supertest';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AddressE2ETestSetup } from './shared/address-e2e-test-setup';
import { AddressE2ETestHelpers } from './shared/address-e2e-test-helpers';
import { AddressE2ETestData } from './shared/address-e2e-test-data';

describe('[DELETE] /addresses/:id - E2E', () => {
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
    it('should delete address successfully and return 204', async () => {
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

      // Generate JWT token for user1
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const addressData = AddressE2ETestData.validAddress({
        profileId: profileId!,
      });
      const createRes = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Act
      const deleteRes = await AddressE2ETestHelpers.deleteAddress(
        app,
        addressId,
        userToken,
      );

      // Assert
      expect(deleteRes.status).toBe(204);
      expect(deleteRes.body).toEqual({}); // No content

      // Verify address was deleted
      const deletedAddress = await prisma.address.findUnique({
        where: { id: addressId },
      });
      expect(deletedAddress).toBeNull();
    });
  });

  describe('Business rules', () => {
    it('should return 404 when address not found', async () => {
      // Arrange - Create a user and get their token
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
      const response = await AddressE2ETestHelpers.deleteAddress(
        app,
        AddressE2ETestData.invalidUUID,
        userToken,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.detail || response.body.message).toMatch(/not found/i);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when invalid UUID format', async () => {
      // Arrange - Create a user and get their token
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
      const response = await AddressE2ETestHelpers.deleteAddress(
        app,
        'invalid-uuid',
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/uuid/i);
    });
  });

  describe('Security', () => {
    it('should return 401 when no authentication token provided', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .delete('/addresses/550e8400-e29b-41d4-a716-446655440099')
        .send();

      // Assert
      expect(response.status).toBe(401);
    });

    it('should not allow deleting address that belongs to another user', async () => {
      // Arrange
      // Create first user with address
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.user1);
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

      const addressData = AddressE2ETestData.validAddress({ profileId: user1ProfileId! });
      const createRes = await AddressE2ETestHelpers.createAddress(app, addressData, user1Token);
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Create second user
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.user2);
      const user2IdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user2.email,
      );
      const user2Token = await AddressE2ETestSetup.generateJwtToken({
        identityId: user2IdentityId!,
        role: 'student',
      });

      // Act - Try to delete user1's address with user2's token
      const response = await AddressE2ETestHelpers.deleteAddress(
        app,
        addressId,
        user2Token,
      );

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.detail || response.body.message).toMatch(/forbidden/i);

      // Verify address still exists
      const addressStillExists = await prisma.address.findUnique({
        where: { id: addressId },
      });
      expect(addressStillExists).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle double deletion gracefully', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.duplicateUser);
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.duplicateUser.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.duplicateUser.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const addressData = AddressE2ETestData.validAddress({ profileId: profileId! });
      const createRes = await AddressE2ETestHelpers.createAddress(app, addressData, userToken);
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Act - Delete twice
      const firstDelete = await AddressE2ETestHelpers.deleteAddress(app, addressId, userToken);
      expect(firstDelete.status).toBe(204);

      const secondDelete = await AddressE2ETestHelpers.deleteAddress(app, addressId, userToken);

      // Assert
      expect(secondDelete.status).toBe(404);
      expect(secondDelete.body.detail || secondDelete.body.message).toMatch(/not found/i);
    });

    it('should verify cascade deletion when profile is deleted', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.securityUser);
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

      // Create multiple addresses for the user
      const address1 = AddressE2ETestData.validAddress({ 
        profileId: profileId!,
        street: '100 First St' 
      });
      const address2 = AddressE2ETestData.validAddress({ 
        profileId: profileId!,
        street: '200 Second Ave' 
      });

      const createRes1 = await AddressE2ETestHelpers.createAddress(app, address1, userToken);
      const createRes2 = await AddressE2ETestHelpers.createAddress(app, address2, userToken);
      expect(createRes1.status).toBe(201);
      expect(createRes2.status).toBe(201);
      const addressId1 = createRes1.body.addressId;
      const addressId2 = createRes2.body.addressId;

      // Act - Delete the user (which should cascade delete addresses)
      await prisma.userIdentity.delete({
        where: { email: AddressE2ETestData.testUsers.securityUser.email },
      });

      // Assert - Verify addresses were cascade deleted
      const deletedAddress1 = await prisma.address.findUnique({
        where: { id: addressId1 },
      });
      const deletedAddress2 = await prisma.address.findUnique({
        where: { id: addressId2 },
      });

      expect(deletedAddress1).toBeNull();
      expect(deletedAddress2).toBeNull();
    });
  });
});
