// src/domain/auth/enterprise/events/user-profile-updated.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserProfileUpdatedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly changedFields: string[];
  public readonly timestamp: Date;

  constructor(
    userId: string,
    changedFields: string[],
    timestamp?: Date
  ) {
    super();
    this.userId = userId;
    this.changedFields = changedFields;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}