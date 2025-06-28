import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
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
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';

@Module({
  imports: [
    // Global configuration and validation
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Database (Prisma) provider
    DatabaseModule,
    // Passport for authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JWT module configured asynchronously
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<JwtModuleOptions> => {
        // Try to read keys directly from environment values
        const envPrivate = config.get<string>('JWT_PRIVATE_KEY');
        const envPublic = config.get<string>('JWT_PUBLIC_KEY');
        console.log('NEXT_PUBLIC_URL:', config.get('NEXT_PUBLIC_URL'));

        let privateKey: string;
        let publicKey: string;

        if (envPrivate && envPublic) {
          // Keys provided as complete strings
          privateKey = envPrivate;
          publicKey = envPublic;
        } else {
          // Fallback to file paths
          const privatePath = config.get<string>('JWT_PRIVATE_KEY_PATH');
          const publicPath = config.get<string>('JWT_PUBLIC_KEY_PATH');

          if (!privatePath) {
            throw new Error(
              'Missing configuration: JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH must be defined',
            );
          }
          if (!publicPath) {
            throw new Error(
              'Missing configuration: JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH must be defined',
            );
          }

          // Synchronous file reads (UTF-8)
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
    // Repository bindings
    { provide: IAccountRepository, useClass: PrismaAccountRepository },
    { provide: IAddressRepository, useClass: PrismaAddressRepository },

    // Domain use cases
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,

    // Authentication services and guards
    LocalStrategy,
    SignInService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,

    // Miscellaneous providers
    { provide: 'SALT_ROUNDS', useValue: 8 },
  ],
  exports: [
    // Export auth-related modules/services for other parts of the app
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    SignInService,

    // Use cases
    CreateAccountUseCase,
    AuthenticateUserUseCase,
    UpdateAccountUseCase,
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
  ],
})
export class AuthModule {}
