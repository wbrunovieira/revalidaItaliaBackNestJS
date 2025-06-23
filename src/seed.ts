// src/seed.ts
import { PrismaClient } from '@prisma/client';
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
      cpf: '11111111111',
      password: 'Senha123!',
      role: 'student',
    },
    {
      email: 'gabriela@revalidaitalia.com.br',
      name: 'Gabriela',
      cpf: '22222222222',
      password: 'Senha123!',
      role: 'student',
    },
    {
      email: 'bruno@wbdigitalsolutions.com',
      name: 'Bruno',
      cpf: '33333333333',
      password: 'Senha123!',
      role: 'student',
    },
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      const hashed = bcrypt.hashSync(u.password, 10);
      try {
        await prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            cpf: u.cpf,
            password: hashed,
            role: u.role,
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
