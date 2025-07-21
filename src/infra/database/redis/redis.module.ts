// src/infra/database/redis/redis.module.ts
import { Module, Global, DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { redisProviders } from './redis.provider';
import { redisCompatProvider } from './redis-compat.provider';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Global Redis Module
 * 
 * Provides a centralized Redis client for the entire application.
 * Used by stats, online tracking, caching, and other features.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [...redisProviders, redisCompatProvider],
  exports: [REDIS_CLIENT, 'default_IORedisModuleConnectionToken'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private moduleRef: ModuleRef) {}

  /**
   * Clean up Redis connection on module destroy
   */
  async onModuleDestroy() {
    const redisClient = this.moduleRef.get<Redis>(REDIS_CLIENT, { strict: false });
    if (redisClient) {
      await redisClient.quit();
    }
  }

  /**
   * For backward compatibility with @nestjs-modules/ioredis
   * This allows modules using InjectRedis to work with our centralized client
   */
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
    };
  }
}