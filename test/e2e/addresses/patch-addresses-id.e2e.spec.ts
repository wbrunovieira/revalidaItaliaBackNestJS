// test/e2e/addresses/patch-addresses-id.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
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

  afterAll(async () => {
    await AddressE2ETestSetup.cleanupTestData(prisma);
    if (app) {
      await app.close();
    }
  });

  describe('Success cases', () => {
    it('should update address fields successfully', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.patchUser);
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.patchUser.email,
      );

      const initialAddress = AddressE2ETestData.validAddress({
        profileId,
        street: '300 Oak St',
        number: '30',
        complement: 'Apt 1',
        district: 'Uptown',
        city: 'Cityplace',
        state: 'Statezone',
        postalCode: '33344-556',
      });

      const createRes = await AddressE2ETestHelpers.createAddress(app, initialAddress);
      expect(createRes.status).toBe(201);
      const addressId = createRes.body.addressId;

      // Act
      const updateData = {
        street: '301 Oak St',
        number: '31',
      };
      const updateRes = await AddressE2ETestHelpers.updateAddress(app, addressId, updateData);

      // Assert
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.street).toBe('301 Oak St');
      expect(updateRes.body.number).toBe('31');
      // Other fields should remain unchanged
      expect(updateRes.body.city).toBe(initialAddress.city);
      expect(updateRes.body.postalCode).toBe(initialAddress.postalCode);

      // Cleanup
      await prisma.address.deleteMany({ where: { profileId } });
      await prisma.userIdentity.delete({
        where: { email: AddressE2ETestData.testUsers.patchUser.email },
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when no fields provided for update', async () => {
      // Act
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        AddressE2ETestData.invalidUUID,
        {},
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/at least one field/i);
    });
  });

  describe('Business rules', () => {
    it('should return 404 when address not found', async () => {
      // Act
      const updateData = { street: 'New Street' };
      const response = await AddressE2ETestHelpers.updateAddress(
        app,
        AddressE2ETestData.invalidUUID,
        updateData,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.detail).toMatch(/not found/i);
    });
  });
});