// src/domain/auth/enterprise/events/user-logged-out.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserLoggedOutEvent extends DomainEvent {
  public readonly userId: string;
  public readonly timestamp: Date;

  constructor(userId: string, timestamp?: Date) {
    super();
    this.userId = userId;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}