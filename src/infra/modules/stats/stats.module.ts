// src/infra/modules/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@/infra/database/database.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserStatsSubscriber } from './subscribers/user-stats.subscriber';

/**
 * Stats Module
 *
 * Collects and provides statistics about system usage.
 * Uses centralized Redis from DatabaseModule for fast, persistent counters.
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule, // Gets Redis from centralized module
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
