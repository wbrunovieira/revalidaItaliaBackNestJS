// src/infra/http.module.ts

import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { StudentsController } from './controllers/students.controller'
import { DatabaseModule } from './database/database.module'
import { AuthController } from './controllers/auth.controller'
import { AddressController } from './controllers/address.controller'


@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ StudentsController , AuthController, AddressController],
  providers: [],                   
})
export class HttpModule {}