// src/domain/auth/application/event-handlers/user-created.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';

/**
 * User Created Event Handler
 *
 * Handles UserCreatedEvent for domain-level side effects.
 * This is where you would add domain logic that should happen
 * after a user is created (not infrastructure concerns).
 */
@Injectable()
export class UserCreatedHandler {
  @OnEvent(UserCreatedEvent.name)
  async handle(event: UserCreatedEvent): Promise<void> {
    const { identityId, email, fullName, role, source } = event;

    console.log(`[Domain] User created:`, {
      userId: identityId,
      email: email,
      fullName: fullName,
      role: role,
      source,
      occurredAt: event.occurredAt,
    });

    // Here you could:
    // - Send welcome email (through a domain service)
    // - Initialize user preferences
    // - Create default user settings
    // - Notify other bounded contexts
  }
}
