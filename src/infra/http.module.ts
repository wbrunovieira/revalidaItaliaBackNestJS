// src/infra/http.module.ts

import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'


@Module({
  imports: [AuthModule],
  controllers: [],   // aqui você injeta CreateAccountUseCase etc.
  providers: [],                    // não precisa redeclarar CreateAccountUseCase
})
export class HttpModule {}