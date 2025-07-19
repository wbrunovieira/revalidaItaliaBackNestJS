// src/domain/auth/enterprise/events/user-created.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { User } from '../entities/user.entity';

export type UserCreationSource = 'admin' | 'hotmart' | 'api';

export class UserCreatedEvent extends DomainEvent {
  public readonly user: User;
  public readonly source: UserCreationSource;

  constructor(user: User, source: UserCreationSource) {
    super();
    this.user = user;
    this.source = source;
  }

  getAggregateId(): UniqueEntityID {
    return this.user.id;
  }
}