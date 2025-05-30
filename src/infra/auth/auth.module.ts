// src/infra/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'


import { DatabaseModule } from '@/infra/database/database.module'
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository'
import { PrismaAccountRepository } from '@/infra/database/prisma/repositories/prisma-account-repositories'

import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case'
import { AuthenticateUserUseCase }     from '@/domain/auth/application/use-cases/authenticate-user.use-case'


import { LocalStrategy }         from './strategies/local.strategy'
import { JwtStrategy }           from './strategies/jwt.strategy'
import { JwtAuthGuard }          from './guards/jwt-auth.guard'
import { RolesGuard }            from './guards/roles.guard'
import { SignInService } from './strategies/sign-in.service'
import { UpdateAccountUseCase } from '@/domain/auth/application/use-cases/update-account.use-case'
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case'
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository'
import { PrismaAddressRepository } from '../database/prisma/repositories/prisma-address-repository'

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    DatabaseModule,  
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.get('JWT_PRIVATE_KEY'),
        publicKey:  config.get('JWT_PUBLIC_KEY'),
        signOptions: { algorithm: 'RS256', expiresIn: '1h' },
      }),
    }),
  ],
  providers: [

    { provide: IAccountRepository, useClass: PrismaAccountRepository },

    {
      provide: IAddressRepository,
      useClass: PrismaAddressRepository,
    },
    CreateAddressUseCase,
    LocalStrategy,
    SignInService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,


    { provide: 'SALT_ROUNDS', useValue: 8 },
  ],
  exports: [
    SignInService,
    JwtAuthGuard,
    RolesGuard,
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,
    JwtModule
  ],
})
export class AuthModule {}