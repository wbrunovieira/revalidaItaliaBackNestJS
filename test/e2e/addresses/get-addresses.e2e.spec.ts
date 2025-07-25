// test/e2e/addresses/get-addresses.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
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

  afterAll(async () => {
    await AddressE2ETestSetup.cleanupTestData(prisma);
    if (app) {
      await app.close();
    }
  });

  describe('Success cases', () => {
    it('should return addresses for a valid profileId', async () => {
      // Arrange
      await AddressE2ETestSetup.createTestUser(app, AddressE2ETestData.testUsers.getUser);
      const profileId = await AddressE2ETestSetup.getProfileIdByEmail(
        prisma,
        AddressE2ETestData.testUsers.getUser.email,
      );

      const addressData = AddressE2ETestData.validAddress({
        profileId,
        street: '200 Main St',
        number: '20',
        complement: '',
        district: 'Midtown',
        city: 'Townsville',
        state: 'Stateland',
        postalCode: '22233-445',
      });

      await AddressE2ETestHelpers.createAddress(app, addressData);

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(app, profileId!);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].street).toBe('200 Main St');

      // Cleanup
      await prisma.address.deleteMany({ where: { profileId } });
      await prisma.userIdentity.delete({
        where: { email: AddressE2ETestData.testUsers.getUser.email },
      });
    });

    it('should return empty array when no addresses exist for profileId', async () => {
      // Arrange
      const nonExistentProfileId = AddressE2ETestData.invalidUUID;

      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(
        app,
        nonExistentProfileId,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when profileId is missing', async () => {
      // Act
      const response = await AddressE2ETestHelpers.getAddressesByProfileId(app, '');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.detail).toMatch(/profileId/i);
    });
  });
});