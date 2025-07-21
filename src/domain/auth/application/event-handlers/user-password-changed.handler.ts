// src/domain/auth/application/event-handlers/user-password-changed.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserPasswordChangedEvent } from '@/domain/auth/enterprise/events/user-password-changed.event';

/**
 * User Password Changed Event Handler
 * 
 * Handles UserPasswordChangedEvent for domain-level side effects.
 */
@Injectable()
export class UserPasswordChangedHandler {
  @OnEvent(UserPasswordChangedEvent.name)
  async handle(event: UserPasswordChangedEvent): Promise<void> {
    const { user } = event;
    
    console.log(`[Domain] User password changed:`, {
      userId: user.id.toString(),
      email: user.email.value,
      occurredAt: event.occurredAt,
    });
    
    // Here you could:
    // - Send security notification email
    // - Invalidate existing sessions
    // - Log security event
    // - Update password change history
  }
}