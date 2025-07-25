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
      expect(profileId).toBeTruthy();

      const addressData = AddressE2ETestData.validAddress({ profileId: profileId! });

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
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
    it('should return 500 when profile not found (FK violation)', async () => {
      // Arrange
      const addressData = {
        ...AddressE2ETestData.validAddress(),
        profileId: AddressE2ETestData.invalidUUID,
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
      );

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.detail).toMatch(/database error|profile not found/i);
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
      );
      const secondResponse = await AddressE2ETestHelpers.createAddress(
        app,
        addressData2,
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
      const addressData = {
        ...AddressE2ETestData.validAddress({ profileId: profileId! }),
        street: 'A'.repeat(256), // Exceeds typical varchar(255) limit
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
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
      const addressData = {
        ...AddressE2ETestData.validAddress({ profileId: profileId! }),
        street: "'; DROP TABLE addresses; --",
        city: "<script>alert('xss')</script>",
      };

      // Act
      const response = await AddressE2ETestHelpers.createAddress(
        app,
        addressData,
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
