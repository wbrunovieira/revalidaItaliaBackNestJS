// src/infra/modules/stats/stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class StatsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Increment user counters
   */
  async incrementUserCount(
    role: string,
    source: string,
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Increment total users
    pipeline.incr('stats:users:total');
    
    // Increment by role
    pipeline.incr(`stats:users:role:${role}`);
    
    // Increment by source
    pipeline.incr(`stats:users:source:${source}`);
    
    // Increment daily count
    pipeline.incr(`stats:users:daily:${date}`);
    pipeline.expire(`stats:users:daily:${date}`, 90 * 24 * 60 * 60); // Keep for 90 days
    
    await pipeline.exec();
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [total, adminCount, tutorCount, studentCount] = await this.redis.mget(
      'stats:users:total',
      'stats:users:role:admin',
      'stats:users:role:tutor',
      'stats:users:role:student',
    );

    const [adminSource, hotmartSource, apiSource] = await this.redis.mget(
      'stats:users:source:admin',
      'stats:users:source:hotmart',
      'stats:users:source:api',
    );

    return {
      total: parseInt(total || '0', 10),
      byRole: {
        admin: parseInt(adminCount || '0', 10),
        tutor: parseInt(tutorCount || '0', 10),
        student: parseInt(studentCount || '0', 10),
      },
      bySource: {
        admin: parseInt(adminSource || '0', 10),
        hotmart: parseInt(hotmartSource || '0', 10),
        api: parseInt(apiSource || '0', 10),
      },
    };
  }
}