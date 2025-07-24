// src/infra/database/redis/redis.constants.ts

/**
 * Injection token for Redis client
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Redis key prefixes for different domains
 */
export const REDIS_PREFIXES = {
  STATS: 'stats:',
  ONLINE_USERS: 'online_users:',
  CACHE: 'cache:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
} as const;
