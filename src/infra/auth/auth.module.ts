import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as fs from 'fs';

import { DatabaseModule } from '@/infra/database/database.module';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { PrismaAccountRepository } from '@/infra/database/prisma/repositories/prisma-account-repositories';
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository';
import { PrismaAddressRepository } from '@/infra/database/prisma/repositories/prisma-address-repository';

import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case';
import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authenticate-user.use-case';
import { UpdateAccountUseCase } from '@/domain/auth/application/use-cases/update-account.use-case';
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case';
import { FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-user.use-case';
import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '@/domain/auth/application/use-cases/delete-address.use-case';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SignInService } from './strategies/sign-in.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const envPrivate = config.get<string>('JWT_PRIVATE_KEY');
        const envPublic = config.get<string>('JWT_PUBLIC_KEY');

        let privateKey: string;
        let publicKey: string;

        if (envPrivate && envPublic) {
          privateKey = envPrivate;
          publicKey = envPublic;
        } else {
          const privatePath = config.get<string>('JWT_PRIVATE_KEY_PATH');
          const publicPath = config.get<string>('JWT_PUBLIC_KEY_PATH');

          if (!privatePath || !publicPath) {
            throw new Error(
              'JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH (and PUBLIC) must be defined',
            );
          }

          privateKey = fs.readFileSync(privatePath, 'utf8');
          publicKey = fs.readFileSync(publicPath, 'utf8');
        }

        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '1h',
          },
        };
      },
    }),
  ],
  providers: [
    // Repositories
    { provide: IAccountRepository, useClass: PrismaAccountRepository },
    { provide: IAddressRepository, useClass: PrismaAddressRepository },

    // Use Cases
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,

    // Auth
    LocalStrategy,
    SignInService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,

    // Config
    { provide: 'SALT_ROUNDS', useValue: 8 },
  ],
  exports: [
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    SignInService,

    // Use Cases
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
  ],
})
export class AuthModule {}
