import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-user-profile.use-case';
import { UpdateOwnProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-own-profile.use-case';
import { ProfileController } from '@/infra/controllers/profile.controller';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule],
  controllers: [ProfileController],
  providers: [
    // Domain use cases
    UpdateUserProfileUseCase,
    UpdateOwnProfileUseCase,
  ],
  exports: [UpdateUserProfileUseCase, UpdateOwnProfileUseCase],
})
export class ProfileModule {}
