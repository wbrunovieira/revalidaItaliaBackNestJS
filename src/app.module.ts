// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';

import { envSchema } from '@/env/env';
import { cryptoConfig } from '@/infra/config/crypto.config';

import { HttpModule } from '@/infra/http.module';
import { EventsModule } from '@/infra/events/events.module';

/**
 * App Module
 *
 * Root module of the application. Configures global services and imports
 * all feature modules through HttpModule.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cryptoConfig],
      validate: (config) => envSchema.parse(config),
    }),
    AxiosHttpModule,
    EventsModule, // Global events infrastructure
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
