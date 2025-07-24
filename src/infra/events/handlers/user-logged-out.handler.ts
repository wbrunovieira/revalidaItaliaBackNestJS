// src/infra/events/handlers/user-logged-out.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoggedOutEvent } from '@/domain/auth/enterprise/events/user-logged-out.event';
import { IOnlineUserTracker } from '@/domain/auth/application/services/i-online-user-tracker';

@Injectable()
export class UserLoggedOutHandler {
  constructor(
    @Inject(IOnlineUserTracker)
    private readonly onlineTracker: IOnlineUserTracker,
  ) {}

  @OnEvent('UserLoggedOutEvent')
  async handle(event: UserLoggedOutEvent): Promise<void> {
    try {
      // Remove user from online tracking
      await this.onlineTracker.removeUser(event.userId);

      console.log(`User logged out: ${event.userId}`);
    } catch (error) {
      console.error('Error handling UserLoggedOutEvent:', error);
      // Don't throw - we don't want tracking errors to affect logout
    }
  }
}
