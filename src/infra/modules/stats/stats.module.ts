// src/infra/modules/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserStatsSubscriber } from './subscribers/user-stats.subscriber';

/**
 * Stats Module
 * 
 * Collects and provides statistics about system usage.
 * Uses Redis for fast, persistent counters.
 */
@Module({
  imports: [
    ConfigModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('REDIS_URL', 'redis://redis:6379'),
      }),
    }),
  ],
  controllers: [StatsController],
  providers: [StatsService, UserStatsSubscriber],
  exports: [StatsService],
})
export class StatsModule {
  constructor(private userStatsSubscriber: UserStatsSubscriber) {
    // Subscriber auto-registers in constructor
  }
}