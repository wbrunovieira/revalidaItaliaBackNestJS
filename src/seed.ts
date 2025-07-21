// src/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Seed rodará apenas em development.');
    process.exit(0);
  }

  const users = [
    {
      email: 'jones@revalidaitalia.com.br',
      name: 'Jones',
      nationalId: '11111111111',
      password: 'Senha123!',
      role: UserRole.admin,
    },
    {
      email: 'gabriela@revalidaitalia.com.br',
      name: 'Gabriela',
      nationalId: '22222222222',
      password: 'Senha123!',
      role: UserRole.admin,
    },
    {
      email: 'bruno@wbdigitalsolutions.com',
      name: 'Bruno',
      nationalId: '33333333333',
      password: 'Senha123!',
      role: UserRole.admin,
    },
  ];

  for (const u of users) {
    const exists = await prisma.userIdentity.findUnique({
      where: { email: u.email },
    });
    if (!exists) {
      const hashed = bcrypt.hashSync(u.password, 10);
      try {
        // Create UserIdentity with related Profile and Authorization
        await prisma.userIdentity.create({
          data: {
            email: u.email,
            password: hashed,
            emailVerified: true,
            profile: {
              create: {
                fullName: u.name,
                nationalId: u.nationalId,
              },
            },
            authorization: {
              create: {
                role: u.role,
              },
            },
          },
        });
        console.log(`✔ Usuário criado: ${u.email}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`⚠ Conflito ao criar ${u.email}: ${e.meta.target}`);
        } else {
          throw e;
        }
      }
    } else {
      console.log(`ℹ Usuário já existe: ${u.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
