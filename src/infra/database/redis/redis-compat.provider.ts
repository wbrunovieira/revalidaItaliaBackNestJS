// src/infra/database/redis/redis-compat.provider.ts
import { Provider } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Compatibility provider for @nestjs-modules/ioredis
 *
 * This allows modules using @InjectRedis() to work with our centralized Redis client
 */
export const redisCompatProvider: Provider = {
  provide: 'default_IORedisModuleConnectionToken', // Token used by @nestjs-modules/ioredis
  useExisting: REDIS_CLIENT,
};
