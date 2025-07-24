// src/infra/database/redis/redis.provider.ts
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService) => {
      const redisUrl = configService.get('REDIS_URL', 'redis://redis:6379');

      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 1000);
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
          }
          return false;
        },
      });

      client.on('connect', () => {
        console.log('Redis client connected');
      });

      client.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      client.on('close', () => {
        console.log('Redis connection closed');
      });

      return client;
    },
    inject: [ConfigService],
  },
];
