// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/env/env';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';  


import { AuthModule } from '@/infra/auth/auth.module';
import { HttpModule } from '@/infra/http.module';
import { CourseModule } from './infra/course.module';
import { ModuleModule } from './infra/module.module';
import { VideoModule } from './infra/video.module';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    AxiosHttpModule,
    AuthModule,
    CourseModule,
    ModuleModule,
    VideoModule,
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}