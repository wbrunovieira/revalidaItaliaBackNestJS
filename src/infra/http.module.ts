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

import { ArgumentModule } from './argument.module';
import { QuestionModule } from './question.module';
import { QuestionOptionModule } from './question-option.module';
import { AnswerModule } from './answer.module';
import { AttemptModule } from './attempt.module';

@Module({
  imports: [
    AuthModule,
    CourseModule,
    DatabaseModule,
    ModuleModule,
    VideoModule,
    AssessmentModule,
    ArgumentModule,
    QuestionModule,
    QuestionOptionModule,
    AnswerModule,
    AttemptModule,
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
