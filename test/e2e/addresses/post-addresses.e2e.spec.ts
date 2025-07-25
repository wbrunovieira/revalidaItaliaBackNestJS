// test/e2e/addresses/post-addresses.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import request from 'supertest';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AddressE2ETestSetup } from './shared/address-e2e-test-setup';
import { AddressE2ETestHelpers } from './shared/address-e2e-test-helpers';
import { AddressE2ETestData } from './shared/address-e2e-test-data';

describe('[POST] /addresses - E2E', () => {
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
    it('should create address when all required fields are provided', async () => {
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

      const addressData = AddressE2ETestData.validAddress({ profileId: profileId! });

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.addressId).toBeTruthy();

      // Verify in database
      const savedAddress = await prisma.address.findFirst({
        where: { profileId },
      });
      expect(savedAddress).toBeTruthy();
      expect(savedAddress?.street).toBe(addressData.street);
      expect(savedAddress?.postalCode).toBe(addressData.postalCode);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when missing required fields', async () => {
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

      const incompleteAddress = {
        profileId: profileId!,
        city: 'Cityville',
        country: 'Countryland',
        postalCode: '11122-334',
      } as any; // Type assertion necessário pois estamos propositalmente omitindo campos obrigatórios

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        incompleteAddress,
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toBeTruthy();
      expect(response.body.detail.toLowerCase()).toMatch(
        /street|number|district|city/,
      );
    });
  });

  describe('Business rules', () => {
    it('should return 403 when profile not found (user trying to create for non-existent profile)', async () => {
      // Arrange
      // Create a user to get a valid token
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

      const addressData = {
        ...AddressE2ETestData.validAddress(),
        profileId: AddressE2ETestData.invalidUUID,
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.detail || response.body.message).toMatch(/forbidden/i);
    });

    it('should allow creating multiple addresses for same profile', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.duplicateUser,
      );
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
      
      const addressData1 = AddressE2ETestData.validAddress({ profileId: profileId! });
      const addressData2 = {
        ...AddressE2ETestData.validAddress({ profileId: profileId! }),
        street: '200 Oak St',
        number: '20A',
      };

      // Act - Create multiple addresses
      const firstResponse = await AddressE2ETestHelpers.createAddress(
        app,
        addressData1,
        userToken,
      );
      const secondResponse = await AddressE2ETestHelpers.createAddress(
        app,
        addressData2,
        userToken,
      );

      // Assert - Both should succeed
      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      
      // Verify both addresses exist
      const addresses = await prisma.address.findMany({
        where: { profileId },
      });
      expect(addresses).toHaveLength(2);
    });


    it('should return 400 when fields exceed maximum length', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.lengthUser,
      );
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.lengthUser.email,
      );
      const identityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.lengthUser.email,
      );
      expect(profileId).toBeTruthy();
      expect(identityId).toBeTruthy();

      // Generate JWT token for user
      const userToken = await AddressE2ETestSetup.generateJwtToken({
        identityId: identityId!,
        role: 'student',
      });

      const addressData = {
        ...AddressE2ETestData.validAddress({ profileId: profileId! }),
        street: 'A'.repeat(256), // Exceeds typical varchar(255) limit
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/street.*length|too long/i);
    });
  });

  describe('Security', () => {
    it('should return 401 when no authentication token provided', async () => {
      // Arrange
      const addressData = AddressE2ETestData.validAddress({ 
        profileId: AddressE2ETestData.invalidUUID 
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/addresses')
        .send(addressData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 when user tries to create address for another user', async () => {
      // Arrange
      // Create user1
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user1,
      );
      const user1ProfileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );
      
      // Create user2
      await AddressE2ETestSetup.createTestUser(
        app,
        AddressE2ETestData.testUsers.user2,
      );
      const user2IdentityId = await AddressE2ETestSetup.getIdentityIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user2.email,
      );
      
      // Generate JWT token for user2
      const user2Token = await AddressE2ETestSetup.generateJwtToken({
        identityId: user2IdentityId!,
        role: 'student',
      });

      // Act - User2 tries to create address for User1's profile
      const addressData = AddressE2ETestData.validAddress({ 
        profileId: user1ProfileId! 
      });
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        user2Token,
      );

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.detail || response.body.message).toMatch(/forbidden/i);
    });

    it('should sanitize input to prevent SQL injection', async () => {
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

      const addressData = {
        ...AddressE2ETestData.validAddress({ profileId: profileId! }),
        street: "'; DROP TABLE addresses; --",
        city: "<script>alert('xss')</script>",
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
        userToken,
      );

      // Assert - Should create successfully with sanitized data
      expect(response.status).toBe(201);
      
      // Verify the data was properly escaped
      const savedAddress = await prisma.address.findFirst({
        where: { profileId },
      });
      expect(savedAddress?.street).toBe("'; DROP TABLE addresses; --");
      expect(savedAddress?.city).toBe("<script>alert('xss')</script>");
    });
  });
});
