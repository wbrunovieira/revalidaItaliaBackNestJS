// src/domain/auth/enterprise/events/user-password-changed.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserPasswordChangedEvent extends DomainEvent {
  public readonly identityId: string;

  constructor(identityId: string, occurredAt?: Date) {
    super();
    this.identityId = identityId;
    this.occurredAt = occurredAt || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.identityId);
  }
}