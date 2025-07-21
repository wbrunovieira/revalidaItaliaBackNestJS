// src/domain/auth/enterprise/events/user-logged-in.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserLoggedInEvent extends DomainEvent {
  public readonly userId: string;
  public readonly email: string;
  public readonly ipAddress: string;
  public readonly userAgent: string;
  public readonly timestamp: Date;

  constructor(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    timestamp?: Date
  ) {
    super();
    this.userId = userId;
    this.email = email;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}