// src/domain/auth/application/subscribers/on-user-created.ts
import { DomainEvents } from '@/core/domain/events/domain-events';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';

export class OnUserCreated {
  constructor() {
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

    console.log(`[UserCreated] New user created:`, {
      id: user.id.toString(),
      email: user.email,
      source,
      occurredAt: event.occurredAt,
    });

    // TODO: Implement actual logic here
    // Examples:
    // - Send welcome email
    // - Create initial profile settings
    // - Log to audit system
    // - If source is 'hotmart', enroll in purchased course
    
    switch (source) {
      case 'admin':
        // Admin created user - maybe send invitation email
        break;
      case 'hotmart':
        // Hotmart webhook - auto-enroll in course
        break;
      case 'api':
        // Self-registration - send verification email
        break;
    }
  }
}