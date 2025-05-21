// src/infra/http.module.ts

import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { StudentsController } from './controllers/students.controller'
import { DatabaseModule } from './database/database.module'


@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ StudentsController ],
  providers: [],                   
})
export class HttpModule {}