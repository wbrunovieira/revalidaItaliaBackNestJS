// src/infra/modules/stats/subscribers/user-stats.subscriber.ts
import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@/core/domain/events/domain-events';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';
import { StatsService } from '../stats.service';

@Injectable()
export class UserStatsSubscriber {
  constructor(private statsService: StatsService) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      UserCreatedEvent.name,
      this.handleUserCreated.bind(this),
    );
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    const { user, source } = event;

    try {
      await this.statsService.incrementUserCount(user.role, source);
      
      console.log(`[Stats] User count incremented:`, {
        userId: user.id.toString(),
        role: user.role,
        source,
      });
    } catch (error) {
      console.error('[Stats] Failed to increment user count:', error);
      // Don't throw - stats should not break user creation
    }
  }
}