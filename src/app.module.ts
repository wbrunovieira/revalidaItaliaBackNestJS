// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/env/env';


import { AuthModule } from '@/infra/auth/auth.module';
import { HttpModule } from '@/infra/http.module';
import { CourseModule } from './infra/course.module';
import { ModuleModule } from './infra/module.module';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    AuthModule,
    CourseModule,
    ModuleModule,
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}