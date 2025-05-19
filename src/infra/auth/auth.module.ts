// src/infra/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'

import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository'
import { AccountRepository }   from './repositories/account.repository'
import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case'
import { JwtStrategy }         from './strategies/jwt.strategy'
import { JwtAuthGuard }        from './guards/jwt-auth.guard'
import { RolesGuard }          from './guards/roles.guard'

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey:  Buffer.from(config.get('JWT_PRIVATE_KEY'), 'base64').toString('utf8'),
        publicKey:   Buffer.from(config.get('JWT_PUBLIC_KEY'),  'base64').toString('utf8'),
        signOptions: { algorithm: 'RS256', expiresIn: '1h' },
      }),
    }),
  ],
  providers: [
    // infra
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,

    // repository binding
    { provide: IAccountRepository, useClass: AccountRepository },

    // injection token para salt rounds
    {
      provide: 'SALT_ROUNDS',
      useValue: 8,      // ou extraia de configService se preferir
    },

    // use case
    CreateAccountUseCase,
  ],
  exports: [
    CreateAccountUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}