// src/infra/modules/stats/subscribers/user-stats.subscriber.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';
import { StatsService } from '../stats.service';

/**
 * User Stats Subscriber
 * 
 * Infrastructure handler for UserCreatedEvent.
 * Updates statistics when users are created.
 */
@Injectable()
export class UserStatsSubscriber {
  constructor(private statsService: StatsService) {}

  @OnEvent(UserCreatedEvent.name)
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    const { identityId, role, source } = event;

    try {
      await this.statsService.incrementUserCount(role, source);
      
      console.log(`[Stats] User count incremented:`, {
        userId: identityId,
        role: role,
        source,
      });
    } catch (error) {
      console.error('[Stats] Failed to increment user count:', error);
      // Don't throw - stats should not break user creation
    }
  }
}