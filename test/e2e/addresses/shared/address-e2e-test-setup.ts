// test/e2e/addresses/shared/address-e2e-test-setup.ts
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export class AddressE2ETestSetup {
  static testEmails = [
    'addr-user1@example.com',
    'addr-user2@example.com',
    'get-addr@example.com',
    'patch-addr@example.com',
    'duplicate-addr@example.com',
    'postal-addr@example.com',
    'length-addr@example.com',
    'security-addr@example.com',
  ];

  static async cleanupTestData(prisma: PrismaService) {
    if (!prisma) return;

    // Buscar UserIdentity pelos emails
    const identities = await prisma.userIdentity.findMany({
      where: { email: { in: this.testEmails } },
      select: { id: true },
    });
    const identityIds = identities.map((u) => u.id);

    // Buscar UserProfiles relacionados
    const profiles = await prisma.userProfile.findMany({
      where: { identityId: { in: identityIds } },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    // Deletar addresses relacionados aos profiles
    await prisma.address.deleteMany({
      where: { profileId: { in: profileIds } },
    });

    // Deletar profiles, authorizations e identities (cascade)
    await prisma.userIdentity.deleteMany({
      where: { email: { in: this.testEmails } },
    });
  }

  static async createTestUser(
    app: INestApplication,
    userData: {
      name: string;
      email: string;
      password: string;
      nationalId: string;
      role?: string;
    },
  ) {
    const request = (await import('supertest')).default;
    
    const userRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer test-jwt-token')
      .send({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        nationalId: userData.nationalId,
        role: userData.role || 'student',
      });

    if (userRes.status !== 201) {
      throw new Error(`Failed to create user: ${userRes.body.message}`);
    }

    return userRes.body;
  }

  static async getProfileIdByEmail(
    prisma: PrismaService,
    email: string,
  ): Promise<string | undefined> {
    const identity = await prisma.userIdentity.findUnique({
      where: { email },
      include: { profile: true },
    });
    return identity?.profile?.id;
  }
}