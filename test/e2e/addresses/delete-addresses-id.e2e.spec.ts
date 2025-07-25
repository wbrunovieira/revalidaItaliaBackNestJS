// test/e2e/addresses/delete-addresses-id.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
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

  afterAll(async () => {
    await AddressE2ETestSetup.cleanupTestData(prisma);
    if (app) {
      await app.close();
    }
  });

  describe('Success cases', () => {
    it('should delete address successfully and return 204', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.user1);
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.user1.email,
      );

      const addressData = AddressE2ETestData.validAddress({ profileId });
      const createRes = await AddressE2ETestHelpers.createAddress(app, addressData);
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Act
      const deleteRes = await AddressE2ETestHelpers.deleteAddress(app, addressId);

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
      // Act
      const response = await AddressE2ETestHelpers.deleteAddress(
        app,
        AddressE2ETestData.invalidUUID,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/i);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when invalid UUID format', async () => {
      // Act
      const response = await AddressE2ETestHelpers.deleteAddress(app, 'invalid-uuid');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/uuid/i);
    });
  });
});