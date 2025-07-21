// src/domain/auth/enterprise/events/user-created.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export type UserCreationSource = 'admin' | 'hotmart' | 'api' | 'registration';

export class UserCreatedEvent extends DomainEvent {
  public readonly identityId: string;
  public readonly email: string;
  public readonly fullName: string;
  public readonly role: string;
  public readonly source: UserCreationSource;

  constructor(
    identityId: string,
    email: string,
    fullName: string,
    role: string,
    source: UserCreationSource,
    occurredAt?: Date,
  ) {
    super();
    this.identityId = identityId;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.source = source;
    // occurredAt is set in parent constructor
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.identityId);
  }
}