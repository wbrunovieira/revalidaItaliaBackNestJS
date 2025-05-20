// src/infra/http.module.ts

import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { AccountController } from './controllers/account.controller'
import { DatabaseModule } from './database/database.module'


@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ AccountController ],
  providers: [],                   
})
export class HttpModule {}