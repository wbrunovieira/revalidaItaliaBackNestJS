import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { AuthModule } from '../auth/auth.module';

import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity.repository';
import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile.repository';
import { PrismaUserIdentityRepository } from '@/infra/database/prisma/repositories/prisma-user-identity-repository';
import { PrismaUserProfileRepository } from '@/infra/database/prisma/repositories/prisma-user-profile-repository';

import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-user-profile.use-case';
import { UpdateOwnProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-own-profile.use-case';
import { ProfileController } from '@/infra/controllers/profile.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    // Repository bindings
    { provide: IUserIdentityRepository, useClass: PrismaUserIdentityRepository },
    { provide: IUserProfileRepository, useClass: PrismaUserProfileRepository },

    // Domain use cases
    UpdateUserProfileUseCase,
    UpdateOwnProfileUseCase,
  ],
  exports: [UpdateUserProfileUseCase, UpdateOwnProfileUseCase],
})
export class ProfileModule {}