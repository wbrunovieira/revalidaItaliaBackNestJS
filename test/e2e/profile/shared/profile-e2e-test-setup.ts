// test/e2e/profile/shared/profile-e2e-test-setup.ts
import { PrismaService } from '@/prisma/prisma.service';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function createTestUser(
  prisma: PrismaService,
  userData: {
    id?: string;
    fullName: string;
    email: string;
    password: string;
    nationalId: string;
    role?: 'admin' | 'tutor' | 'student';
    phone?: string;
    birthDate?: Date;
    profileImageUrl?: string;
    preferredLanguage?: string;
    timezone?: string;
  },
) {
  const hashedPassword = await hash(userData.password, 8);
  const identityId = userData.id || randomUUID();

  return await prisma.userIdentity.create({
    data: {
      id: identityId,
      email: userData.email,
      password: hashedPassword,
      emailVerified: true,
      profile: {
        create: {
          fullName: userData.fullName,
          nationalId: userData.nationalId,
          preferredLanguage: userData.preferredLanguage || 'pt-BR',
          timezone: userData.timezone || 'America/Sao_Paulo',
          phone: userData.phone,
          birthDate: userData.birthDate,
          profileImageUrl: userData.profileImageUrl,
        },
      },
      authorization: {
        create: {
          role: userData.role || 'student',
        },
      },
    },
    include: {
      profile: true,
      authorization: true,
    },
  });
}

export async function cleanupTestUsers(
  prisma: PrismaService,
  emails: string[],
) {
  // Delete in correct order to respect foreign key constraints
  await prisma.userAuthorization.deleteMany({
    where: {
      identity: {
        email: {
          in: emails,
        },
      },
    },
  });

  await prisma.userProfile.deleteMany({
    where: {
      identity: {
        email: {
          in: emails,
        },
      },
    },
  });

  await prisma.userIdentity.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  });
}

export async function findUserByEmail(prisma: PrismaService, email: string) {
  return await prisma.userIdentity.findUnique({
    where: { email },
    include: {
      profile: true,
      authorization: true,
    },
  });
}
