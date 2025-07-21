import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import * as fs from 'fs';

import { DatabaseModule } from '@/infra/database/database.module';
import { UserModule } from '@/infra/modules/user/user.module';
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository';
import { PrismaAddressRepository } from '@/infra/database/prisma/repositories/prisma-address-repository';

import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authentication/authenticate-user.use-case';
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case';
import { FindAddressByProfileUseCase } from '@/domain/auth/application/use-cases/find-address-by-profile.use-case';
import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '@/domain/auth/application/use-cases/delete-address.use-case';
import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-user-profile.use-case';

import { AuthController } from '@/infra/controllers/auth.controller';
import { LocalStrategy } from '@/infra/auth/strategies/local.strategy';
import { JwtStrategy } from '@/infra/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/infra/auth/guards/roles.guard';
import { SignInService } from '@/infra/auth/strategies/sign-in.service';

@Module({
  imports: [
    // Global configuration and validation
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Database (Prisma) provider
    DatabaseModule,
    // User module for user repositories
    UserModule,
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
            expiresIn: '7d',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repository bindings
    { provide: IAddressRepository, useClass: PrismaAddressRepository },

    // Domain use cases (auth-specific)
    AuthenticateUserUseCase,
    CreateAddressUseCase,
    FindAddressByProfileUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    UpdateUserProfileUseCase,

    // Authentication services and guards
    LocalStrategy,
    SignInService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,

  ],
  exports: [
    // Export auth-related modules/services for other parts of the app
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    SignInService,

    // Use cases (auth-specific)
    AuthenticateUserUseCase,
    CreateAddressUseCase,
    FindAddressByProfileUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    UpdateUserProfileUseCase,
  ],
})
export class AuthModule {}
