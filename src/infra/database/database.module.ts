// src/infra/database/database.module.ts
import { Module } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { RedisModule } from './redis/redis.module';

/**
 * Database Module
 * 
 * Provides database connections and data access services:
 * - PrismaService for PostgreSQL
 * - RedisModule for Redis (cache, stats, online tracking)
 * 
 * Repository implementations should be provided by their respective domain modules.
 */
@Module({
  imports: [RedisModule],
  providers: [PrismaService],
  exports: [PrismaService, RedisModule],
})
export class DatabaseModule {}
