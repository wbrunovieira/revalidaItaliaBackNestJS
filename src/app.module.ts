// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/env/env';


import { AuthModule } from '@/infra/auth/auth.module';
import { HttpModule } from '@/infra/http.module';
import { CourseModule } from './infra/course.module';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    AuthModule,
    CourseModule,
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}