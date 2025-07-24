// src/domain/auth/enterprise/events/user-email-changed.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserEmailChangedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly oldEmail: string;
  public readonly newEmail: string;
  public readonly timestamp: Date;

  constructor(
    userId: string,
    oldEmail: string,
    newEmail: string,
    timestamp?: Date,
  ) {
    super();
    this.userId = userId;
    this.oldEmail = oldEmail;
    this.newEmail = newEmail;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}
