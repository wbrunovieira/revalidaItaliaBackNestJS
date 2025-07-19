// src/infra/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@/infra/database/database.module';
import { UserController } from '@/infra/controllers/user.controller';

import { IUserRepository } from '@/domain/auth/application/repositories/i-user-repository';
import { PrismaUserRepository } from '@/infra/database/prisma/repositories/prisma-user-repository';

import { CreateUserUseCase } from '@/domain/auth/application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '@/domain/auth/application/use-cases/update-user.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/get-user-by-id.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';

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
    CreateUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    FindUsersUseCase,
    GetUserByIdUseCase,
    DeleteUserUseCase,

    // Repository binding
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [
    IUserRepository,
    
    CreateUserUseCase,
    UpdateUserUseCase,
    ListUsersUseCase,
    FindUsersUseCase,
    GetUserByIdUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
