// src/domain/auth/enterprise/events/user-account-locked.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserAccountLockedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly reason: string;
  public readonly lockedUntil: Date;
  public readonly timestamp: Date;

  constructor(
    userId: string,
    reason: string,
    lockedUntil: Date,
    timestamp?: Date,
  ) {
    super();
    this.userId = userId;
    this.reason = reason;
    this.lockedUntil = lockedUntil;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}
