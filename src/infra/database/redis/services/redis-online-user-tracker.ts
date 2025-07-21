// src/infra/database/redis/services/redis-online-user-tracker.ts
import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import {
  IOnlineUserTracker,
  OnlineUserInfo,
  OnlineUserStats,
} from '@/domain/auth/application/services/i-online-user-tracker';
import { REDIS_CLIENT, REDIS_PREFIXES } from '../redis.constants';

@Injectable()
export class RedisOnlineUserTracker implements IOnlineUserTracker {
  private readonly prefix = REDIS_PREFIXES.ONLINE_USERS;
  private readonly SORTED_SET_KEY = `${this.prefix}active`;
  private readonly USER_INFO_PREFIX = `${this.prefix}info:`;
  private readonly RECENT_LOGIN_PREFIX = `${this.prefix}recent:`;
  private readonly INACTIVE_THRESHOLD_SECONDS = 15 * 60; // 15 minutes
  private readonly RECENT_LOGIN_SECONDS = 5 * 60; // 5 minutes

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async addUser(info: OnlineUserInfo): Promise<void> {
    const pipeline = this.redis.pipeline();
    const now = Date.now();

    // Add user to sorted set with current timestamp as score
    pipeline.zadd(this.SORTED_SET_KEY, now, info.userId);

    // Store user info as hash
    const userInfoKey = `${this.USER_INFO_PREFIX}${info.userId}`;
    pipeline.hset(userInfoKey, {
      userId: info.userId,
      email: info.email,
      loginTime: info.loginTime.toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
    });

    // Set expiration for user info
    pipeline.expire(userInfoKey, this.INACTIVE_THRESHOLD_SECONDS);

    // Track recent login
    const recentLoginKey = `${this.RECENT_LOGIN_PREFIX}${info.userId}`;
    pipeline.set(recentLoginKey, '1', 'EX', this.RECENT_LOGIN_SECONDS);

    await pipeline.exec();
  }

  async removeUser(userId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Remove from sorted set
    pipeline.zrem(this.SORTED_SET_KEY, userId);

    // Delete user info
    pipeline.del(`${this.USER_INFO_PREFIX}${userId}`);

    // Delete recent login tracking
    pipeline.del(`${this.RECENT_LOGIN_PREFIX}${userId}`);

    await pipeline.exec();
  }

  async updateActivity(userId: string): Promise<void> {
    const now = Date.now();
    const pipeline = this.redis.pipeline();

    // Update score in sorted set
    pipeline.zadd(this.SORTED_SET_KEY, now, userId);

    // Update last activity in user info
    const userInfoKey = `${this.USER_INFO_PREFIX}${userId}`;
    pipeline.hset(userInfoKey, 'lastActivity', new Date().toISOString());
    
    // Refresh expiration
    pipeline.expire(userInfoKey, this.INACTIVE_THRESHOLD_SECONDS);

    await pipeline.exec();
  }

  async getActiveUsersCount(): Promise<number> {
    await this.cleanupInactiveUsers();
    return this.redis.zcard(this.SORTED_SET_KEY);
  }

  async getOnlineStats(): Promise<OnlineUserStats> {
    await this.cleanupInactiveUsers();

    // Get total online users
    const totalOnline = await this.redis.zcard(this.SORTED_SET_KEY);

    // Count recent logins
    const recentLoginKeys = await this.redis.keys(`${this.RECENT_LOGIN_PREFIX}*`);
    const recentLogins = recentLoginKeys.length;

    // TODO: To get usersByRole, we would need to store role in user info
    // For now, return zeros
    return {
      totalOnline,
      usersByRole: {
        admin: 0,
        tutor: 0,
        student: 0,
      },
      recentLogins,
    };
  }

  async getOnlineUsers(page: number, pageSize: number): Promise<OnlineUserInfo[]> {
    await this.cleanupInactiveUsers();

    const start = (page - 1) * pageSize;
    const stop = start + pageSize - 1;

    // Get user IDs sorted by last activity (newest first)
    const userIds = await this.redis.zrevrange(this.SORTED_SET_KEY, start, stop);

    if (userIds.length === 0) {
      return [];
    }

    // Get user info for each ID
    const pipeline = this.redis.pipeline();
    for (const userId of userIds) {
      pipeline.hgetall(`${this.USER_INFO_PREFIX}${userId}`);
    }

    const results = await pipeline.exec();
    const users: OnlineUserInfo[] = [];

    if (results) {
      for (const [err, data] of results) {
        if (!err && data) {
          const userInfo = data as Record<string, string>;
          if (userInfo.userId) {
            users.push({
              userId: userInfo.userId,
              email: userInfo.email,
              loginTime: new Date(userInfo.loginTime),
              lastActivity: new Date(userInfo.lastActivity),
              ipAddress: userInfo.ipAddress,
              userAgent: userInfo.userAgent,
            });
          }
        }
      }
    }

    return users;
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const score = await this.redis.zscore(this.SORTED_SET_KEY, userId);
    
    if (!score) {
      return false;
    }

    // Check if user is still active
    const now = Date.now();
    const lastActivity = parseFloat(score);
    const timeSinceLastActivity = now - lastActivity;

    if (timeSinceLastActivity > this.INACTIVE_THRESHOLD_SECONDS * 1000) {
      await this.removeUser(userId);
      return false;
    }

    return true;
  }

  async cleanupInactiveUsers(): Promise<number> {
    const now = Date.now();
    const threshold = now - (this.INACTIVE_THRESHOLD_SECONDS * 1000);

    // Get inactive user IDs
    const inactiveUserIds = await this.redis.zrangebyscore(
      this.SORTED_SET_KEY,
      '-inf',
      threshold,
    );

    if (inactiveUserIds.length === 0) {
      return 0;
    }

    const pipeline = this.redis.pipeline();

    // Remove from sorted set
    pipeline.zremrangebyscore(this.SORTED_SET_KEY, '-inf', threshold);

    // Remove user info and recent login tracking for each inactive user
    for (const userId of inactiveUserIds) {
      pipeline.del(`${this.USER_INFO_PREFIX}${userId}`);
      pipeline.del(`${this.RECENT_LOGIN_PREFIX}${userId}`);
    }

    await pipeline.exec();

    return inactiveUserIds.length;
  }
}