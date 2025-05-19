// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/env/env';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@/infra/auth/auth.module';
import { HttpModule } from '@/infra/http.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),


    AuthModule,


    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}