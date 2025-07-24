// test/e2e/test-helpers/test-auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'test-secret-key',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class TestAuthModule {}
