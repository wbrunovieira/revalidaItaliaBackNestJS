import { Module } from '@nestjs/common';

import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';

import { PrismaService } from '@/prisma/prisma.service';
import { PrismaAccountRepository } from './prisma/repositories/prisma-account-repositories';

@Module({
  providers: [
    PrismaService,
    PrismaAccountRepository,
    {
      provide: IAccountRepository,
      useClass: PrismaAccountRepository,
    },
  ],
  exports: [PrismaService, IAccountRepository, PrismaAccountRepository],
})
export class DatabaseModule {}
