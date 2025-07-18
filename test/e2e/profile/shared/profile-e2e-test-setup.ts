// test/e2e/profile/shared/profile-e2e-test-setup.ts
import { PrismaService } from '@/prisma/prisma.service';
import { hash } from 'bcryptjs';

export async function createTestUser(
  prisma: PrismaService,
  userData: {
    id?: string;
    name: string;
    email: string;
    password: string;
    cpf: string;
    role?: 'admin' | 'tutor' | 'student';
    phone?: string;
    birthDate?: Date;
    profileImageUrl?: string;
  },
) {
  const hashedPassword = await hash(userData.password, 8);
  
  return await prisma.user.create({
    data: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      cpf: userData.cpf,
      role: userData.role || 'student',
      phone: userData.phone,
      birthDate: userData.birthDate,
      profileImageUrl: userData.profileImageUrl,
    },
  });
}

export async function cleanupTestUsers(
  prisma: PrismaService,
  emails: string[],
) {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  });
}

export async function findUserByEmail(
  prisma: PrismaService,
  email: string,
) {
  return await prisma.user.findUnique({
    where: { email },
  });
}