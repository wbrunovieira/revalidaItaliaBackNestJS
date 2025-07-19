import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { AuthModule } from '../auth/auth.module';

import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { PrismaAccountRepository } from '@/infra/database/prisma/repositories/prisma-account-repositories';

import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/update-user-profile.use-case';
import { ProfileController } from '@/infra/controllers/profile.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    // Repository bindings
    { provide: IAccountRepository, useClass: PrismaAccountRepository },

    // Domain use cases
    UpdateUserProfileUseCase,
  ],
  exports: [UpdateUserProfileUseCase],
})
export class ProfileModule {}