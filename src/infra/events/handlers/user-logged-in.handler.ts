// src/infra/events/handlers/user-logged-in.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoggedInEvent } from '@/domain/auth/enterprise/events/user-logged-in.event';
import { IOnlineUserTracker } from '@/domain/auth/application/services/i-online-user-tracker';

@Injectable()
export class UserLoggedInHandler {
  constructor(
    @Inject(IOnlineUserTracker)
    private readonly onlineTracker: IOnlineUserTracker,
  ) {}

  @OnEvent('domain.UserLoggedInEvent')
  async handle(event: UserLoggedInEvent): Promise<void> {
    try {
      // Add user to online tracking
      await this.onlineTracker.addUser({
        userId: event.userId,
        email: event.email,
        loginTime: event.timestamp,
        lastActivity: event.timestamp,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      });

      console.log(`User logged in: ${event.email} from ${event.ipAddress}`);
    } catch (error) {
      console.error('Error handling UserLoggedInEvent:', error);
      // Don't throw - we don't want tracking errors to affect login
    }
  }
}