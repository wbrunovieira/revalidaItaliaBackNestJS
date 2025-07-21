// src/infra/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@/infra/database/database.module';
import { UserController } from '@/infra/controllers/user.controller';

import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { PrismaUserIdentityRepository } from '@/infra/database/prisma/repositories/prisma-user-identity-repository';
import { PrismaUserProfileRepository } from '@/infra/database/prisma/repositories/prisma-user-profile-repository';
import { PrismaUserAuthorizationRepository } from '@/infra/database/prisma/repositories/prisma-user-authorization-repository';
import { PrismaUserAggregatedViewRepository } from '@/infra/database/prisma/repositories/prisma-user-aggregated-view-repository';

import { CreateUserUseCase } from '@/domain/auth/application/use-cases/profile/create-user.use-case';
import { UpdateUserUseCase } from '@/domain/auth/application/use-cases/profile/update-user.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/profile/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/profile/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/profile/get-user-by-id.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/profile/delete-user.use-case';

import { UserCreatedHandler } from '@/domain/auth/application/event-handlers/user-created.handler';
import { UserPasswordChangedHandler } from '@/domain/auth/application/event-handlers/user-password-changed.handler';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '@/domain/auth/application/repositories/i-user-authorization-repository';

/**
 * User Module
 *
 * Manages user lifecycle operations including creation,
 * updates, and queries. This module provides the user repository
 * and use cases for other modules that need user functionality.
 *
 * Note: Authentication logic is handled by AuthModule
 */
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [UserController],
  providers: [
    // Use Cases
    CreateUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    FindUsersUseCase,
    GetUserByIdUseCase,
    DeleteUserUseCase,

    // Event Handlers
    UserCreatedHandler,
    UserPasswordChangedHandler,

    // Repository bindings
    {
      provide: IUserIdentityRepository,
      useClass: PrismaUserIdentityRepository,
    },
    {
      provide: IUserProfileRepository,
      useClass: PrismaUserProfileRepository,
    },
    {
      provide: IUserAuthorizationRepository,
      useClass: PrismaUserAuthorizationRepository,
    },
    {
      provide: IUserAggregatedViewRepository,
      useClass: PrismaUserAggregatedViewRepository,
    },
    // Also provide with string token for @Inject('UserAggregatedViewRepository')
    {
      provide: 'UserAggregatedViewRepository',
      useClass: PrismaUserAggregatedViewRepository,
    },
  ],
  exports: [
    IUserIdentityRepository,
    IUserProfileRepository,
    IUserAuthorizationRepository,
    IUserAggregatedViewRepository,
    'UserAggregatedViewRepository', // Export string token too

    CreateUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    FindUsersUseCase,
    GetUserByIdUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
