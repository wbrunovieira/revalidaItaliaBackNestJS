// src/infra/http.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { StudentsController } from './controllers/students.controller';
import { DatabaseModule } from './database/database.module';
import { AuthController } from './controllers/auth.controller';
import { AddressController } from './controllers/address.controller';

import { CourseModule } from '@/infra/course.module';
import { ModuleModule } from './module.module';
import { VideoModule } from './video.module';
import { VideoController } from './controllers/video.controller';
import { AssessmentModule } from './assessment.module';
import { AssessmentController } from './controllers/assessment.controller';
import { ArgumentModule } from './argument.module';

@Module({
  imports: [
    AuthModule,
    CourseModule,
    DatabaseModule,
    ModuleModule,
    VideoModule,
    AssessmentModule,
    ArgumentModule,
  ],
  controllers: [
    StudentsController,
    AuthController,
    AddressController,
    VideoController,
  ],
  providers: [],
})
export class HttpModule {}
